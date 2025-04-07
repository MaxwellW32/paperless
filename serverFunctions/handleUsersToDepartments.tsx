"use server"
import { db } from "@/db"
import { usersToDepartments } from "@/db/schema"
import { department, departmentSchema, newUserToDepartment, newUserToDepartmentSchema, updateUserToDepartment, updateUserToDepartmentSchema, user, userSchema, userToDepartment, userToDepartmentSchema } from "@/types"
import { ensureUserIsAdmin } from '@/serverFunctions/handleAuth'
import { and, eq } from "drizzle-orm"
import { getSpecificUsers } from "./handleUser"
import { ensureUserCanBeAddedToDepartment } from "@/utility/validation"

export async function addUsersToDepartments(newUsersToDepartmentsObj: newUserToDepartment): Promise<userToDepartment> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserIsAdmin()

    newUserToDepartmentSchema.parse(newUsersToDepartmentsObj)

    //ensure user can be added to company
    const seenUser = await getSpecificUsers(newUsersToDepartmentsObj.userId)
    if (seenUser === undefined) throw new Error("not seeing user")
    ensureUserCanBeAddedToDepartment(seenUser)

    const addedUserToDepartment = await db.insert(usersToDepartments).values({
        ...newUsersToDepartmentsObj,
    }).returning()

    return addedUserToDepartment[0]
}

export async function updateUsersToDepartments(usersToDepartmentsId: userToDepartment["id"], updatedUsersToDepartmentsObj: Partial<updateUserToDepartment>): Promise<userToDepartment> {
    //security check
    await ensureUserIsAdmin()

    updateUserToDepartmentSchema.partial().parse(updatedUsersToDepartmentsObj)

    const [updatedUserDepartment] = await db.update(usersToDepartments)
        .set({
            ...updatedUsersToDepartmentsObj
        })
        .where(eq(usersToDepartments.id, usersToDepartmentsId)).returning()

    return updatedUserDepartment
}

export async function deleteUsersToDepartments(usersToDepartmentsId: userToDepartment["id"]) {
    //security check
    await ensureUserIsAdmin()

    //validation
    userToDepartmentSchema.shape.id.parse(usersToDepartmentsId)

    await db.delete(usersToDepartments).where(eq(usersToDepartments.id, usersToDepartmentsId));
}

export async function getSpecificUsersToDepartments(options: { type: "id", userDepartmentId: userToDepartment["id"] } | { type: "both", userId: user["id"], departmentId: department["id"], runSecurityCheck?: boolean }): Promise<userToDepartment | undefined> {
    if (options.type === "id") {
        userToDepartmentSchema.shape.id.parse(options.userDepartmentId)

        const result = await db.query.usersToDepartments.findFirst({
            where: eq(usersToDepartments.id, options.userDepartmentId),
            with: {
                user: true,
                department: true,
            }
        });

        return result

    } else if (options.type === "both") {
        if (options.runSecurityCheck === undefined) {
            options.runSecurityCheck = true
        }

        //security
        if (options.runSecurityCheck) {
            await ensureUserIsAdmin()
        }

        userSchema.shape.id.parse(options.userId)
        departmentSchema.shape.id.parse(options.departmentId)

        const result = await db.query.usersToDepartments.findFirst({
            where: and(eq(usersToDepartments.userId, options.userId), eq(usersToDepartments.departmentId, options.departmentId)),
            with: {
                user: true,
                department: true,
            }
        });

        return result

    } else {
        throw new Error("invalid selection")
    }
}

export async function getUsersToDepartments(option: { type: "user", userId: user["id"] } | { type: "department", departmentId: department["id"] }): Promise<userToDepartment[]> {
    //security check
    await ensureUserIsAdmin()

    if (option.type === "user") {
        userSchema.shape.id.parse(option.userId)

        const result = await db.query.usersToDepartments.findMany({
            where: eq(usersToDepartments.userId, option.userId),
            with: {
                user: true,
                department: true,
            }
        });

        return result

    } else if (option.type === "department") {
        departmentSchema.shape.id.parse(option.departmentId)

        const result = await db.query.usersToDepartments.findMany({
            where: eq(usersToDepartments.departmentId, option.departmentId),
            with: {
                user: true,
                department: true,
            }
        });

        return result

    } else {
        throw new Error("invalid selection")
    }
}