"use server"
import { db } from "@/db";
import { checklistStarters } from "@/db/schema";
import { checklistStarter, checklistStarterSchema, newChecklistStarter, newChecklistStarterSchema, updateChecklistStarter, updateChecklistStarterSchema } from "@/types";
import { ensureUserIsAdmin, sessionCheckWithError } from "@/utility/sessionCheck";
import { eq } from "drizzle-orm";

export async function addChecklistStarters(newChecklistStartersObj: newChecklistStarter): Promise<checklistStarter> {
    await ensureUserIsAdmin()

    newChecklistStarterSchema.parse(newChecklistStartersObj)

    const [addedChecklistStarter] = await db.insert(checklistStarters).values({
        ...newChecklistStartersObj,
    }).returning()

    return addedChecklistStarter
}

export async function updateChecklistStarters(checklistStarterType: checklistStarter["type"], updatedChecklistStarterObj: Partial<updateChecklistStarter>): Promise<checklistStarter> {
    //admin check
    await ensureUserIsAdmin()

    //validation
    updateChecklistStarterSchema.partial().parse(updatedChecklistStarterObj)

    const [result] = await db.update(checklistStarters)
        .set({
            ...updatedChecklistStarterObj
        })
        .where(eq(checklistStarters.type, checklistStarterType)).returning()

    return result
}

//only run this on server
export async function getSpecificChecklistStarters(checklistStarterType: checklistStarter["type"]): Promise<checklistStarter | undefined> {
    //logged in check
    await sessionCheckWithError()

    checklistStarterSchema.shape.type.parse(checklistStarterType)

    const result = await db.query.checklistStarters.findFirst({
        where: eq(checklistStarters.type, checklistStarterType),
    });

    return result
}

//only run this on server
export async function getChecklistStarters(): Promise<checklistStarter[]> {
    //logged in check
    await sessionCheckWithError()

    const results = await db.query.checklistStarters.findMany();

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