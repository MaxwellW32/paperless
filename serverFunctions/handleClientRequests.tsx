"use server"
import { db } from "@/db"
import { clientRequests } from "@/db/schema"
import { authAcessType, checklistItemType, clientRequest, clientRequestSchema, clientRequestStatusType, company, companySchema, department, newClientRequest, newClientRequestSchema, updateClientRequest, updateClientRequestSchema, user, userSchema } from "@/types"
import { ensureUserHasAccess } from "@/utility/sessionCheck"
import { eq, and, ne } from "drizzle-orm"

export async function addClientRequests(newClientRequestObj: newClientRequest, auth: authAcessType): Promise<clientRequest> {
    //security check - ensures only admin or elevated roles can make change
    const seenSession = await ensureUserHasAccess(auth)

    newClientRequestSchema.parse(newClientRequestObj)

    //one global function to handle checklist automtions

    //add new request
    const addedClientRequest = await db.insert(clientRequests).values({
        userId: seenSession.user.id,
        status: "in-progress",
        dateSubmitted: new Date,
        ...newClientRequestObj,
    }).returning()

    return addedClientRequest[0]
}

export async function updateClientRequests(clientRequestId: clientRequest["id"], updatedClientRequestObj: Partial<updateClientRequest>, auth: authAcessType): Promise<clientRequest> {
    //security check
    await ensureUserHasAccess(auth)

    updateClientRequestSchema.partial().parse(updatedClientRequestObj)

    const [updatedClientRequest] = await db.update(clientRequests)
        .set({
            ...updatedClientRequestObj
        })
        .where(eq(clientRequests.id, clientRequestId)).returning()

    return updatedClientRequest
}

export async function updateClientRequestsChecklist(clientRequestId: clientRequest["id"], updatedChecklistItem: checklistItemType, indexToUpdate: number, auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    clientRequestSchema.shape.id.parse(clientRequestId)

    //get client request
    const seenClientRequest = await getSpecificClientRequest(clientRequestId, auth)
    if (seenClientRequest === undefined) throw new Error("not seeing client request")

    //validation
    if (seenClientRequest.checklist[indexToUpdate] !== undefined && seenClientRequest.checklist[indexToUpdate].type === updatedChecklistItem.type) {
        seenClientRequest.checklist[indexToUpdate] = updatedChecklistItem
    }

    const [updatedClientRequest] = await db.update(clientRequests)
        .set({
            checklist: seenClientRequest.checklist
        })
        .where(eq(clientRequests.id, clientRequestId)).returning()

    return updatedClientRequest

}

export async function deleteClientRequests(clientRequestId: clientRequest["id"], auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    //validation
    clientRequestSchema.shape.id.parse(clientRequestId)

    await db.delete(clientRequests).where(eq(clientRequests.id, clientRequestId));
}

export async function getSpecificClientRequest(clientRequestId: clientRequest["id"], auth: authAcessType): Promise<clientRequest | undefined> {
    clientRequestSchema.shape.id.parse(clientRequestId)

    //security check
    await ensureUserHasAccess(auth)

    const result = await db.query.clientRequests.findFirst({
        where: eq(clientRequests.id, clientRequestId),
        with: {
            checklistStarter: true
        }
    });

    return result
}

export async function getClientRequests(option: { type: "user", userId: user["id"] } | { type: "company", companyId: company["id"] }, status: clientRequestStatusType, getOppositeOfStatus: boolean, auth: authAcessType, limit = 50, offset = 0): Promise<clientRequest[]> {
    //security check
    await ensureUserHasAccess(auth)

    if (option.type === "user") {
        userSchema.shape.id.parse(option.userId)

        const results = await db.query.clientRequests.findMany({
            limit: limit,
            offset: offset,
            where: and(eq(clientRequests.userId, option.userId), getOppositeOfStatus ? ne(clientRequests.status, status) : eq(clientRequests.status, status)),
            with: {
                checklistStarter: true
            },
        });

        return results

    } else if (option.type === "company") {
        companySchema.shape.id.parse(option.companyId)

        const results = await db.query.clientRequests.findMany({
            limit: limit,
            offset: offset,
            where: and(eq(clientRequests.companyId, option.companyId), getOppositeOfStatus ? ne(clientRequests.status, status) : eq(clientRequests.status, status)),
            with: {
                checklistStarter: true
            },
        });

        return results

    } else {
        throw new Error("invalid selection")
    }
}

export async function getClientRequestsForDepartments(status: clientRequestStatusType, getOppositeOfStatus: boolean, departmentId: department["id"], limit = 50, offset = 0): Promise<clientRequest[]> {
    //security check
    await ensureUserHasAccess({ departmentIdBeingAccessed: departmentId })

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

export async function runChecklistAutomation(checklist: checklistItemType[]) {
    //send emails
    //check the latest cimplete index in list
}