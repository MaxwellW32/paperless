"use server"
import { db } from "@/db"
import { departments } from "@/db/schema"
import { department, departmentAuthType, departmentSchema, newDepartment, newDepartmentSchema, smallAdminUpdateDepartmentSchema, updateDepartmentSchema } from "@/types"
import { eq } from "drizzle-orm"
import { ensureCanAccessDepartment, ensureUserIsAdmin } from "./handleAuth"

export async function addDepartments(newDeparmentObj: newDepartment): Promise<department> {
    //security check  
    await ensureCanAccessDepartment({ departmentIdBeingAccessed: "" }, "c")

    newDepartmentSchema.parse(newDeparmentObj)

    //add new request
    const [addedDepartment] = await db.insert(departments).values({
        ...newDeparmentObj,
    }).returning()

    return addedDepartment
}

export async function updateDepartments(deparmentId: department["id"], updatedDepartmentObj: Partial<department>) {
    //security check - ensure only department / admin users
    const { session, accessLevel } = await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId }, "u")

    let validatedUpdatedDepartmentObj: Partial<department> | undefined = undefined

    if (session.user.accessLevel === "admin") {
        validatedUpdatedDepartmentObj = updateDepartmentSchema.partial().parse(updatedDepartmentObj)

    } else {
        //small admin
        if (accessLevel === "admin") {
            validatedUpdatedDepartmentObj = smallAdminUpdateDepartmentSchema.partial().parse(updatedDepartmentObj)

        } else {
            throw new Error("not access to department")
        }
    }

    if (validatedUpdatedDepartmentObj === undefined) throw new Error("not seeing updated department object")

    await db.update(departments)
        .set({
            ...validatedUpdatedDepartmentObj
        })
        .where(eq(departments.id, deparmentId));
}

export async function deleteDepartments(deparmentId: department["id"]) {
    //security check
    await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId }, "d")

    //validation
    departmentSchema.shape.id.parse(deparmentId)

    await db.delete(departments).where(eq(departments.id, deparmentId));
}

export async function getSpecificDepartment(deparmentId: department["id"], departmentAuth: departmentAuthType, runAuth = true): Promise<department | undefined> {
    departmentSchema.shape.id.parse(deparmentId)

    if (runAuth) {
        //security check
        await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId }, "r")
    }

    const result = await db.query.departments.findFirst({
        where: eq(departments.id, deparmentId),
    });

    return result
}

export async function getDepartments(): Promise<department[]> {
    //security check
    await ensureUserIsAdmin()

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