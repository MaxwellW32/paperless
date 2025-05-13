"use server"
import { db } from "@/db";
import { and, desc, eq, ne, sql, SQLWrapper } from "drizzle-orm";
import { ensureCanAccessResource } from "./handleAuth";
import { newTape, newTapeSchema, tape, tapeSchema, updateTape, resourceAuthType, tapeFilterType } from "@/types";
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

export async function getTapes(filter: tapeFilterType, resourceAuth: resourceAuthType, limit = 50, offset = 0, withProperty: { company?: true } = {}): Promise<tape[]> {
    // Security check
    const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: "" }, resourceAuth, "ra")
    interpretAuthResponseAndError(authResponse)

    // Collect conditions dynamically
    const whereClauses: SQLWrapper[] = []

    if (filter.id !== undefined) {
        whereClauses.push(eq(tapes.id, filter.id))
    }

    if (filter.companyId !== undefined) {
        whereClauses.push(eq(tapes.companyId, filter.companyId))
    }

    if (filter.mediaLabel !== undefined) {
        whereClauses.push(
            sql`LOWER(${tapes.mediaLabel}) LIKE LOWER(${`%${filter.mediaLabel}%`})`
        )
    }

    if (filter.tapeLocation !== undefined) {
        whereClauses.push(filter.oppositeLocation ? ne(tapes.tapeLocation, filter.tapeLocation) : eq(tapes.tapeLocation, filter.tapeLocation))
    }

    // Run the query
    const results = await db.query.tapes.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            company: withProperty.company
        },
        orderBy: [desc(tapes.dateAdded)],
    })

    return results
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

export async function deleteTapes(tapeId: tape["id"], resourceAuth: resourceAuthType) {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "tape", tapeId: tapeId }, resourceAuth, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    tapeSchema.shape.id.parse(tapeId)

    await db.delete(tapes).where(eq(tapes.id, tapeId));
}
