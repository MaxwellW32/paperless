"use server"
import { db } from "@/db"
import { usersToCompanies } from "@/db/schema"
import { company, companySchema, newUserToCompany, newUserToCompanySchema, updateUserToCompany, updateUserToCompanySchema, user, userSchema, userToCompany, userToCompanySchema } from "@/types"
import { ensureUserIsAdmin, sessionCheckWithError } from "./handleAuth"
import { and, eq } from "drizzle-orm"
import { getSpecificUsers } from "./handleUser"
import { ensureUserCanBeAddedToCompany } from "@/utility/validation"

export async function addUsersToCompanies(newUsersToCompaniesObj: newUserToCompany): Promise<userToCompany> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserIsAdmin()

    //ensure user can be added to company
    const seenUser = await getSpecificUsers(newUsersToCompaniesObj.userId)
    if (seenUser === undefined) throw new Error("not seeing user")
    ensureUserCanBeAddedToCompany(seenUser)

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

export async function getSpecificUsersToCompanies(options: { type: "id", userCompanyId: userToCompany["id"] } | { type: "both", userId: user["id"], companyId: company["id"], runAuth?: boolean }): Promise<userToCompany | undefined> {
    if (options.type === "id") {
        userToCompanySchema.shape.id.parse(options.userCompanyId)

        const result = await db.query.usersToCompanies.findFirst({
            where: eq(usersToCompanies.id, options.userCompanyId),
            with: {
                user: true,
                company: true,
            }
        });

        return result

    } else if (options.type === "both") {
        if (options.runAuth === undefined) {
            options.runAuth = true
        }

        //security
        if (options.runAuth) {
            await ensureUserIsAdmin()
        }

        userSchema.shape.id.parse(options.userId)
        companySchema.shape.id.parse(options.companyId)

        const result = await db.query.usersToCompanies.findFirst({
            where: and(eq(usersToCompanies.userId, options.userId), eq(usersToCompanies.companyId, options.companyId)),
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

export async function getUsersToCompanies(option: { type: "user", userId: user["id"] } | { type: "company", companyId: company["id"] } | { type: "all" }, limit = 50, offset = 0): Promise<userToCompany[]> {
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

    } else if (option.type === "all") {
        const result = await db.query.usersToCompanies.findMany({
            limit: limit,
            offset: offset,
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

export async function getUsersToCompaniesWithVisitAccess(companyId: company["id"]): Promise<userToCompany[]> {
    companySchema.shape.id.parse(companyId)

    //validation
    await sessionCheckWithError()

    const result = await db.query.usersToCompanies.findMany({
        where: and(eq(usersToCompanies.companyId, companyId), eq(usersToCompanies.onAccessList, true)),
        with: {
            user: true,
        }
    });

    return result
}