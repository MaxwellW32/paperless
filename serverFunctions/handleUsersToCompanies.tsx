"use server"
import { db } from "@/db"
import { usersToCompanies } from "@/db/schema"
import { authAcessType, company, companySchema, newUserToCompany, newUserToCompanySchema, updateUserToCompany, updateUserToCompanySchema, user, userSchema, userToCompany, userToCompanySchema } from "@/types"
import { ensureUserHasAccess } from "@/utility/sessionCheck"
import { and, eq } from "drizzle-orm"

export async function addUsersToCompanies(newUsersToCompaniesObj: newUserToCompany, auth: authAcessType): Promise<userToCompany> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserHasAccess(auth)

    newUserToCompanySchema.parse(newUsersToCompaniesObj)

    const addedUserToCompany = await db.insert(usersToCompanies).values({
        ...newUsersToCompaniesObj,
    }).returning()

    return addedUserToCompany[0]
}

export async function updateUsersToCompanies(usersToCompaniesId: userToCompany["id"], updatedUsersToCompaniesObj: Partial<updateUserToCompany>, auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    updateUserToCompanySchema.partial().parse(updatedUsersToCompaniesObj)

    await db.update(usersToCompanies)
        .set({
            ...updatedUsersToCompaniesObj
        })
        .where(eq(usersToCompanies.id, usersToCompaniesId));
}

export async function deleteUsersToCompanies(usersToCompaniesId: userToCompany["id"], auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    //validation
    userToCompanySchema.shape.id.parse(usersToCompaniesId)

    await db.delete(usersToCompanies).where(eq(usersToCompanies.id, usersToCompaniesId));
}

export async function getSpecificUsersToCompanies(userId: user["id"], companyId: company["id"], auth: authAcessType): Promise<userToCompany | undefined> {
    //security check
    await ensureUserHasAccess(auth)

    userSchema.shape.id.parse(userId)
    companySchema.shape.id.parse(companyId)

    const result = await db.query.usersToCompanies.findFirst({
        where: and(eq(usersToCompanies.userId, userId), eq(usersToCompanies.companyId, companyId)),
        with: {
            user: true,
            company: true,
        }
    });

    return result
}

export async function getUsersFromCompany(companyId: company["id"], auth: authAcessType): Promise<userToCompany[]> {
    //security check
    await ensureUserHasAccess(auth)

    companySchema.shape.id.parse(companyId)

    const result = await db.query.usersToCompanies.findMany({
        where: eq(usersToCompanies.companyId, companyId),
        with: {
            user: true,
            company: true,
        }
    });

    return result
}