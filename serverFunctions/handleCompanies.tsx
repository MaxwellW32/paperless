"use server"
import { db } from "@/db"
import { companies } from "@/db/schema"
import { company, companySchema, newCompany, newCompanySchema, resourceAuthType, smallAdminUpdateCompanySchema, updateCompanySchema } from "@/types"
import { ensureCanAccessResource } from "./handleAuth"
import { eq } from "drizzle-orm"
import { interpretAuthResponseAndError } from "@/utility/utility"

export async function addCompanies(newCompanyObj: newCompany, resourceAuth: resourceAuthType): Promise<company> {
    //security check - ensures only admin can add
    const authResponse = await ensureCanAccessResource({ type: "company", companyId: "" }, resourceAuth, "c")
    interpretAuthResponseAndError(authResponse)

    newCompanySchema.parse(newCompanyObj)

    //add new request
    const [addedDepartment] = await db.insert(companies).values({
        ...newCompanyObj,
    }).returning()

    return addedDepartment
}

export async function updateCompanies(companyId: company["id"], updatedCompanyObj: Partial<company>, resourceAuth: resourceAuthType) {
    //security check  
    const authResponse = await ensureCanAccessResource({ type: "company", companyId: companyId }, resourceAuth, "u")
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

export async function deleteCompanies(companyId: company["id"], resourceAuth: resourceAuthType) {
    //security check
    const authResponse = await ensureCanAccessResource({ type: "company", companyId: companyId }, resourceAuth, "d")
    interpretAuthResponseAndError(authResponse)

    //validation
    companySchema.shape.id.parse(companyId)

    await db.delete(companies).where(eq(companies.id, companyId));
}

export async function getSpecificCompany(companyId: company["id"], resourceAuth: resourceAuthType): Promise<company | undefined> {
    //security check
    const authResponse = await ensureCanAccessResource({ type: "company", companyId: companyId }, resourceAuth, "r")
    interpretAuthResponseAndError(authResponse)

    companySchema.shape.id.parse(companyId)

    const result = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    return result
}

export async function getCompanies(resourceAuth: resourceAuthType): Promise<company[]> {
    const authResponse = await ensureCanAccessResource({ type: "company", companyId: "" }, resourceAuth, "ra")
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