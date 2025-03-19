"use server"
import { db } from "@/db"
import { usersToDepartments } from "@/db/schema"
import { authAcessType, department, departmentSchema, newUserToDepartment, newUserToDepartmentSchema, updateUserToDepartment, updateUserToDepartmentSchema, user, userSchema, userToDepartment, userToDepartmentSchema } from "@/types"
import { ensureUserHasAccess } from "@/utility/sessionCheck"
import { and, eq } from "drizzle-orm"

export async function addUsersToDepartments(newUsersToDepartmentsObj: newUserToDepartment, auth: authAcessType): Promise<userToDepartment> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserHasAccess(auth)

    newUserToDepartmentSchema.parse(newUsersToDepartmentsObj)

    const addedUserToDepartment = await db.insert(usersToDepartments).values({
        ...newUsersToDepartmentsObj,
    }).returning()

    return addedUserToDepartment[0]
}

export async function updateUsersToDepartments(usersToDepartmentsId: userToDepartment["id"], updatedUsersToDepartmentsObj: Partial<updateUserToDepartment>, auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    updateUserToDepartmentSchema.partial().parse(updatedUsersToDepartmentsObj)

    await db.update(usersToDepartments)
        .set({
            ...updatedUsersToDepartmentsObj
        })
        .where(eq(usersToDepartments.id, usersToDepartmentsId));
}

export async function deleteUsersToDepartments(usersToDepartmentsId: userToDepartment["id"], auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    //validation
    userToDepartmentSchema.shape.id.parse(usersToDepartmentsId)

    await db.delete(usersToDepartments).where(eq(usersToDepartments.id, usersToDepartmentsId));
}

export async function getSpecificUsersToDepartments(userId: user["id"], departmentId: department["id"], auth: authAcessType): Promise<userToDepartment | undefined> {
    //security check
    await ensureUserHasAccess(auth)

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

export async function getUsersFromCompany(departmentId: department["id"], auth: authAcessType): Promise<userToDepartment[]> {
    //security check
    await ensureUserHasAccess(auth)

    departmentSchema.shape.id.parse(departmentId)

    const result = await db.query.usersToDepartments.findMany({
        where: eq(usersToDepartments.departmentId, departmentId),
        with: {
            user: true,
            department: true,
        }
    });

    return result
}