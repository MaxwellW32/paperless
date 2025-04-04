"use server"
import { db } from "@/db"
import { departments } from "@/db/schema"
import { department, departmentSchema, newDepartment, newDepartmentSchema, updateDepartmentSchema } from "@/types"
import { ensureCanAccessDepartment } from "@/utility/sessionCheck"
import { eq } from "drizzle-orm"

export async function addDepartments(newDeparmentObj: newDepartment): Promise<department> {
    //security check - ensures only admin or elevated roles can make change
    await ensureCanAccessDepartment({ departmentIdBeingAccessed: "", allowRegularAccess: true })

    newDepartmentSchema.parse(newDeparmentObj)

    //add new request
    const [addedDepartment] = await db.insert(departments).values({
        ...newDeparmentObj,
    }).returning()

    return addedDepartment
}

export async function updateDepartments(deparmentId: department["id"], updatedDepartmentObj: Partial<department>) {
    //security check
    await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId })

    updateDepartmentSchema.partial().parse(updatedDepartmentObj)

    await db.update(departments)
        .set({
            ...updatedDepartmentObj
        })
        .where(eq(departments.id, deparmentId));
}

export async function deleteDepartments(deparmentId: department["id"]) {
    //security check
    await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId })

    //validation
    departmentSchema.shape.id.parse(deparmentId)

    await db.delete(departments).where(eq(departments.id, deparmentId));
}

export async function getSpecificDepartment(deparmentId: department["id"], skipAuth = false): Promise<department | undefined> {
    departmentSchema.shape.id.parse(deparmentId)

    if (!skipAuth) {
        //security check
        await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId })
    }

    const result = await db.query.departments.findFirst({
        where: eq(departments.id, deparmentId),
    });

    return result
}

export async function getDepartments(): Promise<department[]> {
    //security check
    await ensureCanAccessDepartment({ departmentIdBeingAccessed: "", allowRegularAccess: true })

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