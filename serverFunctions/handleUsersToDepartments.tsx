"use server"
import { db } from "@/db"
import { usersToDepartments } from "@/db/schema"
import { department, departmentSchema, newUserToDepartment, newUserToDepartmentSchema, updateUserToDepartment, updateUserToDepartmentSchema, user, userSchema, userToDepartment, userToDepartmentSchema } from "@/types"
import { ensureUserIsAdmin } from "@/utility/sessionCheck"
import { and, eq } from "drizzle-orm"

export async function addUsersToDepartments(newUsersToDepartmentsObj: newUserToDepartment): Promise<userToDepartment> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserIsAdmin()

    newUserToDepartmentSchema.parse(newUsersToDepartmentsObj)

    const addedUserToDepartment = await db.insert(usersToDepartments).values({
        ...newUsersToDepartmentsObj,
    }).returning()

    return addedUserToDepartment[0]
}

export async function updateUsersToDepartments(usersToDepartmentsId: userToDepartment["id"], updatedUsersToDepartmentsObj: Partial<updateUserToDepartment>) {
    //security check
    await ensureUserIsAdmin()

    updateUserToDepartmentSchema.partial().parse(updatedUsersToDepartmentsObj)

    await db.update(usersToDepartments)
        .set({
            ...updatedUsersToDepartmentsObj
        })
        .where(eq(usersToDepartments.id, usersToDepartmentsId));
}

export async function deleteUsersToDepartments(usersToDepartmentsId: userToDepartment["id"]) {
    //security check
    await ensureUserIsAdmin()

    //validation
    userToDepartmentSchema.shape.id.parse(usersToDepartmentsId)

    await db.delete(usersToDepartments).where(eq(usersToDepartments.id, usersToDepartmentsId));
}

export async function getSpecificUsersToDepartments(userId: user["id"], departmentId: department["id"], runSecurityCheck = true): Promise<userToDepartment | undefined> {
    //security
    if (runSecurityCheck) {
        await ensureUserIsAdmin()
    }

    userSchema.shape.id.parse(userId)
    departmentSchema.shape.id.parse(departmentId)

    const result = await db.query.usersToDepartments.findFirst({
        where: and(eq(usersToDepartments.userId, userId), eq(usersToDepartments.departmentId, departmentId)),
        with: {
            user: true,
            department: true,
        }
    });

    return result
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