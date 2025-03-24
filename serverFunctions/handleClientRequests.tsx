"use server"
import { db } from "@/db"
import { clientRequests } from "@/db/schema"
import { authAcessType, clientRequest, clientRequestSchema, company, companySchema, newClientRequest, newClientRequestSchema, updateClientRequest, updateClientRequestSchema, user, userSchema } from "@/types"
import { ensureUserHasAccess } from "@/utility/sessionCheck"
import { eq } from "drizzle-orm"

export async function addClientRequests(newClientRequestObj: newClientRequest, auth: authAcessType): Promise<clientRequest> {
    //security check - ensures only admin or elevated roles can make change
    const seenSession = await ensureUserHasAccess(auth)

    newClientRequestSchema.parse(newClientRequestObj)

    //one global function to handle checklist automtions

    //add new request
    const addedClientRequest = await db.insert(clientRequests).values({
        userId: seenSession.user.id,
        status: "in-progress",
        ...newClientRequestObj,
    }).returning()

    return addedClientRequest[0]
}

export async function updateClientRequests(clientRequestId: clientRequest["id"], updatedClientRequestObj: Partial<updateClientRequest>, auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    updateClientRequestSchema.partial().parse(updatedClientRequestObj)

    await db.update(clientRequests)
        .set({
            ...updatedClientRequestObj
        })
        .where(eq(clientRequests.id, clientRequestId));
}

export async function deleteClientRequests(clientRequestId: clientRequest["id"], auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    //validation
    clientRequestSchema.shape.id.parse(clientRequestId)

    await db.delete(clientRequests).where(eq(clientRequests.id, clientRequestId));
}

export async function getSpecificClientRequests(clientRequestId: clientRequest["id"], auth: authAcessType): Promise<clientRequest | undefined> {
    clientRequestSchema.shape.id.parse(clientRequestId)

    //security check
    await ensureUserHasAccess(auth)

    const result = await db.query.clientRequests.findFirst({
        where: eq(clientRequests.id, clientRequestId),
        with: {
            user: true,
            company: true,
        }
    });

    return result
}

export async function getClientRequests(option: { type: "user", userId: user["id"] } | { type: "company", companyId: company["id"] }, auth: authAcessType): Promise<clientRequest[]> {
    //security check
    await ensureUserHasAccess(auth)

    if (option.type === "user") {
        userSchema.shape.id.parse(option.userId)

        const result = await db.query.clientRequests.findMany({
            where: eq(clientRequests.userId, option.userId),
            with: {
                user: true,
                company: true,
            }
        });

        return result

    } else if (option.type === "company") {
        companySchema.shape.id.parse(option.companyId)

        const result = await db.query.clientRequests.findMany({
            where: eq(clientRequests.companyId, option.companyId),
            with: {
                user: true,
                company: true,
            }
        });

        return result

    } else {
        throw new Error("invalid selection")
    }
}

//handle client request status 