"use server"
import { db } from "@/db"
import { departments } from "@/db/schema"
import { department, departmentSchema, newDepartment, newDepartmentSchema, smallAdminUpdateDepartmentSchema, updateDepartmentSchema } from "@/types"
import { eq } from "drizzle-orm"
import { ensureCanAccessDepartment } from "./handleAuth"
import { interpretAuthResponseAndError } from "@/utility/utility"

export async function addDepartments(newDeparmentObj: newDepartment): Promise<department> {
    //security check  
    const authResponse = await ensureCanAccessDepartment({ departmentIdBeingAccessed: "" }, "c")
    interpretAuthResponseAndError(authResponse)

    newDepartmentSchema.parse(newDeparmentObj)

    //add new request
    const [addedDepartment] = await db.insert(departments).values({
        ...newDeparmentObj,
    }).returning()

    return addedDepartment
}

export async function updateDepartments(deparmentId: department["id"], updatedDepartmentObj: Partial<department>) {
    //security check - ensure only department / admin users
    const authResponse = await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId }, "u")
    const { session, accessLevel } = interpretAuthResponseAndError(authResponse)

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
    const authResponse = await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId }, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    departmentSchema.shape.id.parse(deparmentId)

    await db.delete(departments).where(eq(departments.id, deparmentId));
}

export async function getSpecificDepartment(deparmentId: department["id"], runAuth = true): Promise<department | undefined> {
    departmentSchema.shape.id.parse(deparmentId)

    if (runAuth) {
        //security check
        const authResponse = await ensureCanAccessDepartment({ departmentIdBeingAccessed: deparmentId }, "r")
        interpretAuthResponseAndError(authResponse)
    }

    const result = await db.query.departments.findFirst({
        where: eq(departments.id, deparmentId),
    });

    return result
}

export async function getDepartments(): Promise<department[]> {
    //security check
    const authResponse = await ensureCanAccessDepartment({ departmentIdBeingAccessed: "" }, "ra")
    interpretAuthResponseAndError(authResponse)

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