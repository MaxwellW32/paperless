"use server"
import { db } from "@/db"
import { companies } from "@/db/schema"
import { company, companyAuthType, companySchema, newCompany, newCompanySchema, smallAdminUpdateCompanySchema, updateCompanySchema } from "@/types"
import { ensureCanAccessCompany, ensureUserIsAdmin } from "./handleAuth"

import { eq } from "drizzle-orm"

export async function addCompanies(newCompanyObj: newCompany): Promise<company> {
    //security check - ensures only admin can add
    await ensureUserIsAdmin()

    newCompanySchema.parse(newCompanyObj)

    //add new request
    const [addedDepartment] = await db.insert(companies).values({
        ...newCompanyObj,
    }).returning()

    return addedDepartment
}

export async function updateCompanies(companyId: company["id"], updatedCompanyObj: Partial<company>) {
    //security check - only app admins / company admin
    const { session, accessLevel } = await ensureCanAccessCompany({ companyIdBeingAccessed: companyId })

    let validatedUpdatedCompanyObj: Partial<company> | undefined = undefined

    if (session.user.accessLevel === "admin") {
        validatedUpdatedCompanyObj = updateCompanySchema.partial().parse(updatedCompanyObj)

    } else {
        //small admin
        if (accessLevel === "admin") {
            validatedUpdatedCompanyObj = smallAdminUpdateCompanySchema.partial().parse(updatedCompanyObj)

        } else {
            throw new Error("not access to company")
        }
    }

    if (validatedUpdatedCompanyObj === undefined) throw new Error("not seeing updated company object")

    await db.update(companies)
        .set({
            ...updatedCompanyObj
        })
        .where(eq(companies.id, companyId));
}

export async function deleteCompanies(companyId: company["id"]) {
    //security check
    await ensureUserIsAdmin()

    //validation
    companySchema.shape.id.parse(companyId)

    await db.delete(companies).where(eq(companies.id, companyId));
}

export async function getSpecificCompany(companyId: company["id"], companyAuth: companyAuthType): Promise<company | undefined> {
    companySchema.shape.id.parse(companyId)

    //security check
    await ensureCanAccessCompany(companyAuth)

    const result = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    return result
}

export async function getCompanies(skipCheck = false): Promise<company[]> {
    //security check
    if (!skipCheck) {
        await ensureUserIsAdmin()
    }

    const results = await db.query.companies.findMany({
        with: {
            usersToCompanies: {
                with: {
                    user: true
                }
            }
        },
    });

    return results
}