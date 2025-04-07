"use server"
import { db } from "@/db"
import { clientRequests } from "@/db/schema"
import { checklistItemType, clientRequest, clientRequestAuthType, clientRequestSchema, clientRequestStatusType, company, companyAuthType, companySchema, department, departmentAuthType, newClientRequest, newClientRequestSchema, updateClientRequest, updateClientRequestSchema, user, userSchema } from "@/types"
import { eq, and, ne } from "drizzle-orm"
import { sendEmail } from "./handleMail"
import { ensureCanAccessClientRequest, ensureCanAccessCompany, ensureCanAccessDepartment, ensureUserIsAdmin, sessionCheckWithError } from "./handleAuth"

export async function addClientRequests(newClientRequestObj: newClientRequest, clientRequestAuth: clientRequestAuthType runAutomation = true): Promise<clientRequest> {
    //security check - ensures only admin or elevated roles can make change
    const session = await ensureCanAccessClientRequest(clientRequestAuth, "c")

    newClientRequestSchema.parse(newClientRequestObj)

    //add new request
    const [addedClientRequest] = await db.insert(clientRequests).values({
        userId: session.user.id,
        status: "in-progress",
        dateSubmitted: new Date,
        ...newClientRequestObj,
    }).returning()

    if (runAutomation) {
        await runChecklistAutomation(addedClientRequest.id, addedClientRequest.checklist)
    }

    return addedClientRequest
}

export async function updateClientRequests(clientRequestId: clientRequest["id"], updatedClientRequestObj: Partial<updateClientRequest>, clientRequestAuth: clientRequestAuthType, runAutomation = true, runAuth = true): Promise<clientRequest> {
    if (runAuth) {
        //security check
        await ensureCanAccessClientRequest(clientRequestAuth, "u")
    }

    updateClientRequestSchema.partial().parse(updatedClientRequestObj)

    const [updatedClientRequest] = await db.update(clientRequests)
        .set({
            ...updatedClientRequestObj
        })
        .where(eq(clientRequests.id, clientRequestId)).returning()

    if (runAutomation) {
        await runChecklistAutomation(updatedClientRequest.id, updatedClientRequest.checklist)
    }

    return updatedClientRequest
}

export async function updateClientRequestsChecklist(clientRequestId: clientRequest["id"], updatedChecklistItem: checklistItemType, indexToUpdate: number, clientRequestAuth: clientRequestAuthType, runAuth = true): Promise<clientRequest> {
    if (runAuth) {
        //security check
        await ensureCanAccessClientRequest(clientRequestAuth, "u")
    }

    clientRequestSchema.shape.id.parse(clientRequestId)

    //get client request
    const seenClientRequest = await getSpecificClientRequest(clientRequestId, clientRequestAuth, runAuth)
    if (seenClientRequest === undefined) throw new Error("not seeing client request")

    //validation
    if (seenClientRequest.checklist[indexToUpdate] !== undefined && seenClientRequest.checklist[indexToUpdate].type === updatedChecklistItem.type) {
        seenClientRequest.checklist[indexToUpdate] = updatedChecklistItem
    }

    //send update
    const updatedClientRequest = await updateClientRequests(clientRequestId, { checklist: seenClientRequest.checklist }, clientRequestAuth, runAuth)
    return updatedClientRequest
}

export async function deleteClientRequests(clientRequestId: clientRequest["id"], clientRequestAuth: clientRequestAuthType) {
    await ensureCanAccessClientRequest(clientRequestAuth, "d")

    //validation
    clientRequestSchema.shape.id.parse(clientRequestId)

    await db.delete(clientRequests).where(eq(clientRequests.id, clientRequestId));
}

export async function getSpecificClientRequest(clientRequestId: clientRequest["id"], clientRequestAuth: clientRequestAuthType, runAuth = true): Promise<clientRequest | undefined> {
    clientRequestSchema.shape.id.parse(clientRequestId)

    if (runAuth) {
        //security check
        await ensureCanAccessClientRequest(clientRequestAuth, "r")
    }

    const result = await db.query.clientRequests.findFirst({
        where: eq(clientRequests.id, clientRequestId),
        with: {
            checklistStarter: true,
        }
    });

    return result
}

export async function getClientRequests(option: { type: "user", userId: user["id"] } | { type: "company", companyId: company["id"], companyAuth: companyAuthType, } | { type: "all" }, filter: { type: "status", status: clientRequestStatusType, getOppositeOfStatus: boolean } | { type: "date" }, limit = 50, offset = 0): Promise<clientRequest[]> {
    if (option.type === "user") {
        await ensureUserIsAdmin()

        //make sure you are that user
        userSchema.shape.id.parse(option.userId)

        const results = await db.query.clientRequests.findMany({
            limit: limit,
            offset: offset,
            where: filter.type === "status" ? and(eq(clientRequests.userId, option.userId), filter.getOppositeOfStatus ? ne(clientRequests.status, filter.status) : eq(clientRequests.status, filter.status)) : undefined,
            with: {
                checklistStarter: true
            },
        });

        return results

    } else if (option.type === "company") {
        //security check
        await sessionCheckWithError()

        companySchema.shape.id.parse(option.companyId)

        const results = await db.query.clientRequests.findMany({
            limit: limit,
            offset: offset,
            where: filter.type === "status" ? and(eq(clientRequests.userId, option.companyId), filter.getOppositeOfStatus ? ne(clientRequests.status, filter.status) : eq(clientRequests.status, filter.status)) : undefined,
            with: {
                checklistStarter: true
            },
        });

        return results

    } else if (option.type === "all") {
        await ensureUserIsAdmin()

        const results = await db.query.clientRequests.findMany({
            limit: limit,
            offset: offset,
            where: filter.type === "status" ? filter.getOppositeOfStatus ? ne(clientRequests.status, filter.status) : eq(clientRequests.status, filter.status) : undefined,
            with: {
                checklistStarter: true,
                company: true
            },
        });

        return results

    } else {
        throw new Error("invalid selection")
    }
}

export async function getClientRequestsForDepartments(status: clientRequestStatusType, getOppositeOfStatus: boolean, departmentId: department["id"], departmentAuth: departmentAuthType, limit = 50, offset = 0): Promise<clientRequest[]> {
    //security check
    await sessionCheckWithError()

    //get client requests in progress
    const results = await db.query.clientRequests.findMany({
        limit: limit,
        offset: offset,
        where: getOppositeOfStatus ? ne(clientRequests.status, status) : eq(clientRequests.status, status),
        with: {
            checklistStarter: true
        },
    });

    //get all active requests that have some signoff needed
    const requestsForDepartmentSignoff = results.filter(eachClientRequest => {
        //check if signoff is needed from department
        const seenIncompleteChecklistItem = eachClientRequest.checklist.find(eachChecklistItem => !eachChecklistItem.completed)
        if (seenIncompleteChecklistItem === undefined) throw new Error("not seeing a checklist item incomplete")

        if (seenIncompleteChecklistItem.type !== "manual" || seenIncompleteChecklistItem.for.type !== "department" || seenIncompleteChecklistItem.for.departmenId !== departmentId) {
            return false
        }

        return true
    })

    return requestsForDepartmentSignoff
}

export async function runChecklistAutomation(clientRequestId: clientRequest["id"], seenChecklist: checklistItemType[]) {
    //checklist that can be updated
    let checklist = seenChecklist

    //check the latest incomplete task
    const latestChecklistItemIndex = checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
    const latestChecklistItem: checklistItemType | undefined = latestChecklistItemIndex !== -1 ? checklist[latestChecklistItemIndex] : undefined

    //if nothing is incomplete then mark client request as finished
    if (latestChecklistItem === undefined) {
        await updateClientRequests(clientRequestId, {
            status: "completed"
        }, { clientRequestIdBeingAccessed: "" }, false, false)

        return
    }

    console.log(`$running automation for`, latestChecklistItem.type);

    //send emails
    if (latestChecklistItem.type === "email") {
        await sendEmail({
            sendTo: latestChecklistItem.to,
            replyTo: undefined,
            subject: latestChecklistItem.subject,
            body: {
                type: "html",
                html: latestChecklistItem.email
            }
        })

        //mark as complete 
        latestChecklistItem.completed = true

        //update
        const newUpdatedClientRequest = await updateClientRequestsChecklist(clientRequestId, latestChecklistItem, latestChecklistItemIndex, { clientRequestIdBeingAccessed: "" }, false)

        //update checklist 
        checklist = newUpdatedClientRequest.checklist
    }

    //stop running
    if (latestChecklistItem.type === "form" || latestChecklistItem.type === "manual") {
        return
    }

    await runChecklistAutomation(clientRequestId, checklist)
}