"use server"
import { db } from "@/db";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { ensureCanAccessResource } from "./handleAuth";
import { newTape, newTapeSchema, tape, tapeSchema, tapeLocation, updateTape, resourceAuthType, company } from "@/types";
import { tapes } from "@/db/schema";
import { interpretAuthResponseAndError } from "@/utility/utility";

export async function addTapes(newTapeObj: newTape, resourceAuth: resourceAuthType): Promise<tape> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: "" }, resourceAuth, "c")
    interpretAuthResponseAndError(authResponse)

    newTapeSchema.parse(newTapeObj)

    //add new
    const [addedTape] = await db.insert(tapes).values({
        ...newTapeObj,
        dateAdded: new Date()
    }).returning()

    return addedTape
}

export async function updateTapes(tapeId: tape["id"], tapeObj: Partial<updateTape>, resourceAuth: resourceAuthType): Promise<tape> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: tapeId }, resourceAuth, "u")
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

export async function getSpecificTapes(tapeId: tape["id"], resourceAuth: resourceAuthType, runAuth = true): Promise<tape | undefined> {
    tapeSchema.shape.id.parse(tapeId)

    if (runAuth) {
        //security check  
        const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: tapeId }, resourceAuth, "r")
        interpretAuthResponseAndError(authResponse)
    }

    const result = await db.query.tapes.findFirst({
        where: eq(tapes.id, tapeId),
        with: {
            company: true
        }
    });

    return result
}

export async function getTapes(option: { type: "mediaLabel", mediaLabel: string, companyId: company["id"], } | { type: "status", tapeLocation: tapeLocation, getOppositeOfStatus: boolean, companyId: company["id"] } | { type: "all" }, resourceAuth: resourceAuthType, limit = 50, offset = 0): Promise<tape[]> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: "" }, resourceAuth, "ra")
    interpretAuthResponseAndError(authResponse)

    if (option.type === "mediaLabel") {
        const results = await db.query.tapes.findMany({
            limit: limit,
            offset: offset,
            where: and(eq(tapes.companyId, option.companyId), (
                sql`LOWER(${tapes.mediaLabel}) LIKE LOWER(${`%${option.mediaLabel}%`})`
            ))
        });

        return results

    } else if (option.type === "all") {
        const results = await db.query.tapes.findMany({
            limit: limit,
            offset: offset,
            with: {
                company: true
            }
        });

        return results

    } else if (option.type === "status") {
        const results = await db.query.tapes.findMany({
            limit: limit,
            offset: offset,
            where: and(eq(tapes.companyId, option.companyId), option.getOppositeOfStatus ? ne(tapes.tapeLocation, option.tapeLocation) : eq(tapes.tapeLocation, option.tapeLocation)),
            orderBy: [desc(tapes.dateAdded)],
        });

        return results

    } else {
        throw new Error("invalid selection")
    }
}

export async function deleteTapes(tapeId: tape["id"], resourceAuth: resourceAuthType) {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: tapeId }, resourceAuth, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    tapeSchema.shape.id.parse(tapeId)

    await db.delete(tapes).where(eq(tapes.id, tapeId));
}
