"use server"
import { db } from "@/db"
import { departments } from "@/db/schema"
import { authAcessType, department, departmentSchema, newDepartment, newDepartmentSchema, updateDepartmentSchema } from "@/types"
import { ensureUserHasAccess } from "@/utility/sessionCheck"
import { eq } from "drizzle-orm"

export async function addDepartments(newDeparmentObj: newDepartment, auth: authAcessType): Promise<department> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserHasAccess(auth)

    newDepartmentSchema.parse(newDeparmentObj)

    //add new request
    const [addedDepartment] = await db.insert(departments).values({
        ...newDeparmentObj,
    }).returning()

    return addedDepartment
}

export async function updateDepartments(deparmentId: department["id"], updatedDepartmentObj: Partial<department>, auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    updateDepartmentSchema.partial().parse(updatedDepartmentObj)

    await db.update(departments)
        .set({
            ...updatedDepartmentObj
        })
        .where(eq(departments.id, deparmentId));
}

export async function deleteDepartments(deparmentId: department["id"], auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    //validation
    departmentSchema.shape.id.parse(deparmentId)

    await db.delete(departments).where(eq(departments.id, deparmentId));
}

export async function getSpecificDepartment(deparmentId: department["id"], auth: authAcessType): Promise<department | undefined> {
    departmentSchema.shape.id.parse(deparmentId)

    //security check
    await ensureUserHasAccess(auth)

    const result = await db.query.departments.findFirst({
        where: eq(departments.id, deparmentId),
    });

    return result
}

export async function getDepartments(auth: authAcessType): Promise<department[]> {
    //security check
    await ensureUserHasAccess(auth)

    const results = await db.query.departments.findMany({
        with: {
            usersToDepartments: {
                with: {
                    user: true
                }
            }
        },
    });

    return results
}