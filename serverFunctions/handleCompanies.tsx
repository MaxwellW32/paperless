"use server"
import { db } from "@/db"
import { companies } from "@/db/schema"
import { company, companyAuthType, companySchema, newCompany, newCompanySchema, smallAdminUpdateCompanySchema, updateCompanySchema } from "@/types"
import { ensureCanAccessCompany, ensureUserIsAdmin } from "./handleAuth"
import { eq } from "drizzle-orm"
import { interpretAuthResponseAndError } from "@/utility/utility"

export async function addCompanies(newCompanyObj: newCompany): Promise<company> {
    //security check - ensures only admin can add
    const authResponse = await ensureCanAccessCompany({ companyIdBeingAccessed: "" }, "c")
    interpretAuthResponseAndError(authResponse)

    newCompanySchema.parse(newCompanyObj)

    //add new request
    const [addedDepartment] = await db.insert(companies).values({
        ...newCompanyObj,
    }).returning()

    return addedDepartment
}

export async function updateCompanies(companyId: company["id"], updatedCompanyObj: Partial<company>) {
    //security check - only app admins / company admin
    const authResponse = await ensureCanAccessCompany({ companyIdBeingAccessed: companyId }, "u")
    const { session, accessLevel } = interpretAuthResponseAndError(authResponse)
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
    const authResponse = await ensureCanAccessCompany({ companyIdBeingAccessed: companyId }, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    companySchema.shape.id.parse(companyId)

    await db.delete(companies).where(eq(companies.id, companyId));
}

export async function getSpecificCompany(companyId: company["id"], companyAuth: companyAuthType): Promise<company | undefined> {
    //security check
    const authResponse = await ensureCanAccessCompany(companyAuth, "r")
    interpretAuthResponseAndError(authResponse)

    companySchema.shape.id.parse(companyId)

    const result = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    return result
}

export async function getCompanies(companyAuth: companyAuthType): Promise<company[]> {
    const authResponse = await ensureCanAccessCompany(companyAuth, "ra")
    interpretAuthResponseAndError(authResponse)

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