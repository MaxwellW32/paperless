"use server"
import { db } from "@/db";
import { checklistStarters } from "@/db/schema";
import { checklistStarter, checklistStarterSchema, newChecklistStarter, newChecklistStarterSchema, updateChecklistStarter, updateChecklistStarterSchema } from "@/types";
import { ensureUserIsAdmin } from '@/serverFunctions/handleAuth'
import { eq } from "drizzle-orm";
import { sessionCheckWithError } from "./handleAuth";

export async function addChecklistStarters(newChecklistStartersObj: newChecklistStarter): Promise<checklistStarter> {
    await ensureUserIsAdmin()

    newChecklistStarterSchema.parse(newChecklistStartersObj)

    const [addedChecklistStarter] = await db.insert(checklistStarters).values({
        ...newChecklistStartersObj,
    }).returning()

    return addedChecklistStarter
}

export async function updateChecklistStarters(checklistStarterId: checklistStarter["id"], updatedChecklistStarterObj: Partial<updateChecklistStarter>): Promise<checklistStarter> {
    //admin check
    await ensureUserIsAdmin()

    //validation
    updateChecklistStarterSchema.partial().parse(updatedChecklistStarterObj)

    const [result] = await db.update(checklistStarters)
        .set({
            ...updatedChecklistStarterObj
        })
        .where(eq(checklistStarters.id, checklistStarterId)).returning()

    return result
}

//only run this on server
export async function getSpecificChecklistStarters(option: { type: "id", checklistId: checklistStarter["id"] } | { type: "type", checklistType: checklistStarter["type"] }): Promise<checklistStarter | undefined> {
    //logged in check
    await sessionCheckWithError()

    if (option.type === "id") {
        checklistStarterSchema.shape.id.parse(option.checklistId)

        const result = await db.query.checklistStarters.findFirst({
            where: eq(checklistStarters.id, option.checklistId),
        });

        return result

    } else if (option.type === "type") {
        checklistStarterSchema.shape.type.parse(option.checklistType)

        const result = await db.query.checklistStarters.findFirst({
            where: eq(checklistStarters.type, option.checklistType),
        });

        return result

    } else {
        throw new Error("invalid selection")
    }
}

//only run this on server
export async function getChecklistStarters(limit = 50, offset = 0): Promise<checklistStarter[]> {
    //logged in check
    await sessionCheckWithError()

    const results = await db.query.checklistStarters.findMany({
        limit: limit,
        offset: offset,
    });

    return results
}

export async function getChecklistStartersTypes(): Promise<(checklistStarter["type"])[]> {
    const results = await db.query.checklistStarters.findMany();
    return results.map(eachChecklistStarter => eachChecklistStarter.type)
}

export async function deleteChecklistStarters(checklistStarterType: checklistStarter["type"]) {
    //admin check
    await ensureUserIsAdmin()

    //validation
    checklistStarterSchema.shape.type.parse(checklistStarterType)

    await db.delete(checklistStarters).where(eq(checklistStarters.type, checklistStarterType));
}