"use server"
import { db } from "@/db";
import { and, desc, eq, ne, sql, SQLWrapper } from "drizzle-orm";
import { ensureCanAccessResource } from "./handleAuth";
import { interpretAuthResponseAndError } from "@/utility/utility";
import { equipmentT, newEquipmentT, newEquipmentSchema, resourceAuthType, equipmentSchema, company, tableFilterTypes } from "@/types";
import { equipment } from "@/db/schema";

export async function addEquipment(newEquipmentObj: newEquipmentT, resourceAuth: resourceAuthType): Promise<equipmentT> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "equipment", equipmentId: "" }, resourceAuth, "c")
    interpretAuthResponseAndError(authResponse)

    newEquipmentSchema.parse(newEquipmentObj)

    //add new
    const [addedEquipment] = await db.insert(equipment).values({
        ...newEquipmentObj,
        dateAdded: new Date()
    }).returning()

    return addedEquipment
}

export async function updateEquipment(equipmentId: equipmentT["id"], equipmentObj: Partial<equipmentT>, resourceAuth: resourceAuthType): Promise<equipmentT> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "equipment", equipmentId: equipmentId }, resourceAuth, "u")
    interpretAuthResponseAndError(authResponse)

    //validation
    equipmentSchema.partial().parse(equipmentObj)

    const [result] = await db.update(equipment)
        .set({
            ...equipmentObj
        })
        .where(eq(equipment.id, equipmentId)).returning()

    return result
}

export async function getSpecificEquipment(equipmentId: equipmentT["id"], resourceAuth: resourceAuthType, runAuth = true): Promise<equipmentT | undefined> {
    equipmentSchema.shape.id.parse(equipmentId)

    if (runAuth) {
        //security check  
        const authResponse = await ensureCanAccessResource({ type: "equipment", equipmentId: equipmentId }, resourceAuth, "r")
        interpretAuthResponseAndError(authResponse)
    }

    const result = await db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
        with: {
            company: true
        }
    });

    return result
}

export async function getEquipment(filter: tableFilterTypes<equipmentT>, resourceAuth: resourceAuthType, limit = 50, offset = 0, withProperty: { company?: true } = {}): Promise<equipmentT[]> {
    // Security check
    const authResponse = await ensureCanAccessResource({ type: "equipment", equipmentId: "" }, resourceAuth, "ra")
    interpretAuthResponseAndError(authResponse)

    // Collect conditions dynamically
    const whereClauses: SQLWrapper[] = []

    if (filter.id !== undefined) {
        whereClauses.push(eq(equipment.id, filter.id))
    }

    if (filter.companyId !== undefined) {
        whereClauses.push(eq(equipment.companyId, filter.companyId))
    }

    if (filter.makeModel !== undefined) {
        whereClauses.push(
            sql`LOWER(${equipment.makeModel}) LIKE LOWER(${`%${filter.makeModel}%`})`
        )
    }

    if (filter.serialNumber !== undefined) {
        whereClauses.push(
            sql`LOWER(${equipment.serialNumber}) LIKE LOWER(${`%${filter.serialNumber}%`})`
        )
    }

    if (filter.equipmentLocation !== undefined) {
        whereClauses.push(
            sql`LOWER(${equipment.equipmentLocation}) LIKE LOWER(${`%${filter.equipmentLocation}%`})`
        )
    }

    // Run the query
    const results = await db.query.equipment.findMany({
        where: and(...whereClauses),
        orderBy: [desc(equipment.dateAdded)],
        limit: limit,
        offset: offset,
        with: {
            company: withProperty.company
        }
    });

    return results
}

export async function getEquipmentOld(filter: { type: "makeModel", makeModel: string, companyId: company["id"] } | { type: "serialNumber", serialNumber: equipmentT["serialNumber"], companyId: company["id"] } | { type: "all" } | { type: "allFromCompany", companyId: company["id"] }, resourceAuth: resourceAuthType, limit = 50, offset = 0): Promise<equipmentT[]> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "equipment", equipmentId: "" }, resourceAuth, "ra")
    interpretAuthResponseAndError(authResponse)

    if (filter.type === "makeModel") {
        const results = await db.query.equipment.findMany({
            limit: limit,
            offset: offset,
            where: and(eq(equipment.companyId, filter.companyId), (
                sql`LOWER(${equipment.makeModel}) LIKE LOWER(${`%${filter.makeModel}%`})`
            ))
        });

        return results

    } else if (filter.type === "serialNumber") {
        const results = await db.query.equipment.findMany({
            limit: limit,
            offset: offset,
            where: and(eq(equipment.companyId, filter.companyId), (
                sql`LOWER(${equipment.serialNumber}) LIKE LOWER(${`%${filter.serialNumber}%`})`
            ))
        });

        return results

    } else if (filter.type === "allFromCompany") {
        const results = await db.query.equipment.findMany({
            limit: limit,
            offset: offset,
            where: eq(equipment.companyId, filter.companyId),
            orderBy: [desc(equipment.dateAdded)],
        });

        return results

    } else if (filter.type === "all") {
        const results = await db.query.equipment.findMany({
            limit: limit,
            offset: offset,
            orderBy: [desc(equipment.dateAdded)],
            with: {
                company: true
            },
        });

        return results

    } else {
        throw new Error("invalid selection")
    }
}

export async function deleteEquipment(equipmentId: equipmentT["id"], resourceAuth: resourceAuthType) {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "equipment", equipmentId: equipmentId }, resourceAuth, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    equipmentSchema.shape.id.parse(equipmentId)

    await db.delete(equipment).where(eq(equipment.id, equipmentId));
}
