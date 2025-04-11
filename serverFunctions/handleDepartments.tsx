"use server"
import { db } from "@/db"
import { departments } from "@/db/schema"
import { department, departmentSchema, newDepartment, newDepartmentSchema, resourceAuthType, smallAdminUpdateDepartmentSchema, updateDepartmentSchema } from "@/types"
import { eq } from "drizzle-orm"
import { ensureCanAccessResource } from "./handleAuth"
import { interpretAuthResponseAndError } from "@/utility/utility"

export async function addDepartments(newDeparmentObj: newDepartment, resourceAuth: resourceAuthType): Promise<department> {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "department", departmentId: "" }, resourceAuth, "c")
    interpretAuthResponseAndError(authResponse)

    newDepartmentSchema.parse(newDeparmentObj)

    //add new request
    const [addedDepartment] = await db.insert(departments).values({
        ...newDeparmentObj,
    }).returning()

    return addedDepartment
}

export async function updateDepartments(deparmentId: department["id"], updatedDepartmentObj: Partial<department>, resourceAuth: resourceAuthType) {
    //security check 
    const authResponse = await ensureCanAccessResource({ type: "department", departmentId: deparmentId }, resourceAuth, "u")
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

export async function deleteDepartments(deparmentId: department["id"], resourceAuth: resourceAuthType) {
    //security check
    const authResponse = await ensureCanAccessResource({ type: "department", departmentId: deparmentId }, resourceAuth, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    departmentSchema.shape.id.parse(deparmentId)

    await db.delete(departments).where(eq(departments.id, deparmentId));
}

export async function getSpecificDepartment(deparmentId: department["id"], resourceAuth: resourceAuthType, runAuth = true): Promise<department | undefined> {
    departmentSchema.shape.id.parse(deparmentId)

    if (runAuth) {
        //security check
        const authResponse = await ensureCanAccessResource({ type: "department", departmentId: deparmentId }, resourceAuth, "r")
        interpretAuthResponseAndError(authResponse)
    }

    const result = await db.query.departments.findFirst({
        where: eq(departments.id, deparmentId),
    });

    return result
}

export async function getDepartments(resourceAuth: resourceAuthType, limit = 50, offset = 0): Promise<department[]> {
    //security check
    const authResponse = await ensureCanAccessResource({ type: "department", departmentId: "" }, resourceAuth, "ra")

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