"use server"
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { ensureCanAccessTape, } from "./handleAuth";
import { companyAuthType, newTape, newTapeSchema, tape, tapeSchema, updateTape } from "@/types";
import { tapes } from "@/db/schema";
import { interpretAuthResponseAndError } from "@/utility/utility";

export async function addTapes(newTapeObj: newTape, companyAuth: companyAuthType): Promise<tape> {
    //security check  
    const authResponse = await ensureCanAccessTape(companyAuth, "c")
    interpretAuthResponseAndError(authResponse)

    newTapeSchema.parse(newTapeObj)

    //add new request
    const [addedTape] = await db.insert(tapes).values({
        ...newTapeObj,
        dateAdded: new Date()
    }).returning()

    return addedTape
}

export async function updateTapes(tapeId: tape["id"], tapeObj: Partial<updateTape>, companyAuth: companyAuthType): Promise<tape> {
    //security check  
    const authResponse = await ensureCanAccessTape(companyAuth, "u")
    interpretAuthResponseAndError(authResponse)

    //validation
    tapeSchema.partial().parse(tapeObj)

    const [result] = await db.update(tapes)
        .set({
            ...tapeObj
        })
        .where(eq(tapes.id, tapeId)).returning()

    return result
}

export async function getSpecificTapes(tapeId: tape["id"], companyAuth: companyAuthType): Promise<tape | undefined> {
    //security check  
    const authResponse = await ensureCanAccessTape(companyAuth, "r")
    interpretAuthResponseAndError(authResponse)
    tapeSchema.shape.id.parse(tapeId)

    const result = await db.query.tapes.findFirst({
        where: eq(tapes.id, tapeId),
    });

    return result
}

export async function getTapes(option: { type: "mediaLabel", mediaLabel: string } | { type: "all" }, companyAuth: companyAuthType, limit = 50, offset = 0): Promise<tape[]> {
    //security check  
    const authResponse = await ensureCanAccessTape(companyAuth, "ra")
    interpretAuthResponseAndError(authResponse)

    if (option.type === "mediaLabel") {
        const results = await db.query.tapes.findMany({
            limit: limit,
            offset: offset,
            where: (
                sql`LOWER(${tapes.mediaLabel}) LIKE LOWER(${`%${option.mediaLabel}%`})`
            )
        });

        return results

    } else if (option.type === "all") {
        const results = await db.query.tapes.findMany({
            limit: limit,
            offset: offset,
        });

        return results

    } else {
        throw new Error("invalid selection")
    }
}

export async function deleteTapes(tapeId: tape["id"]) {
    //security check  
    const authResponse = await ensureCanAccessTape({}, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    tapeSchema.shape.id.parse(tapeId)

    await db.delete(tapes).where(eq(tapes.id, tapeId));
}
