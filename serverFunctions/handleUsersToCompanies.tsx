"use server"
import { db } from "@/db"
import { usersToCompanies } from "@/db/schema"
import { company, companyAuthType, companySchema, newUserToCompany, newUserToCompanySchema, updateUserToCompany, updateUserToCompanySchema, user, userSchema, userToCompany, userToCompanySchema } from "@/types"
import { ensureCanAccessCompany, ensureUserIsAdmin } from "@/utility/sessionCheck"
import { and, eq } from "drizzle-orm"

export async function addUsersToCompanies(newUsersToCompaniesObj: newUserToCompany): Promise<userToCompany> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserIsAdmin()

    newUserToCompanySchema.parse(newUsersToCompaniesObj)

    const addedUserToCompany = await db.insert(usersToCompanies).values({
        ...newUsersToCompaniesObj,
    }).returning()

    return addedUserToCompany[0]
}

export async function updateUsersToCompanies(usersToCompaniesId: userToCompany["id"], updatedUsersToCompaniesObj: Partial<updateUserToCompany>) {
    //security check
    await ensureUserIsAdmin()

    updateUserToCompanySchema.partial().parse(updatedUsersToCompaniesObj)

    await db.update(usersToCompanies)
        .set({
            ...updatedUsersToCompaniesObj
        })
        .where(eq(usersToCompanies.id, usersToCompaniesId));
}

export async function deleteUsersToCompanies(usersToCompaniesId: userToCompany["id"]) {
    //security check
    await ensureUserIsAdmin()

    //validation
    userToCompanySchema.shape.id.parse(usersToCompaniesId)

    await db.delete(usersToCompanies).where(eq(usersToCompanies.id, usersToCompaniesId));
}

export async function getSpecificUsersToCompanies(userId: user["id"], companyId: company["id"], runSecurityCheck = true): Promise<userToCompany | undefined> {
    //security
    if (runSecurityCheck) {
        await ensureUserIsAdmin()
    }

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

export async function getUsersToCompanies(option: { type: "user", userId: user["id"] } | { type: "company", companyId: company["id"] }): Promise<userToCompany[]> {
    //security check
    await ensureUserIsAdmin()

    if (option.type === "user") {
        userSchema.shape.id.parse(option.userId)

        const result = await db.query.usersToCompanies.findMany({
            where: eq(usersToCompanies.userId, option.userId),
            with: {
                user: true,
                company: true,
            }
        });

        return result

    } else if (option.type === "company") {
        companySchema.shape.id.parse(option.companyId)

        const result = await db.query.usersToCompanies.findMany({
            where: eq(usersToCompanies.companyId, option.companyId),
            with: {
                user: true,
                company: true,
            }
        });

        return result

    } else {
        throw new Error("invalid selection")
    }
}

export async function getUsersToCompaniesWithVisitAccess(companyId: company["id"], companyAuth: companyAuthType): Promise<userToCompany[]> {
    companySchema.shape.id.parse(companyId)

    await ensureCanAccessCompany(companyAuth)

    const result = await db.query.usersToCompanies.findMany({
        where: and(eq(usersToCompanies.companyId, companyId), eq(usersToCompanies.onAccessList, true)),
        with: {
            user: true,
        }
    });

    return result
}