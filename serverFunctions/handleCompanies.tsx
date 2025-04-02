"use server"
import { db } from "@/db"
import { companies } from "@/db/schema"
import { authAcessType, company, companySchema, newCompany, newCompanySchema, updateCompanySchema } from "@/types"
import { ensureUserHasAccess } from "@/utility/sessionCheck"
import { eq } from "drizzle-orm"

export async function addCompanies(newCompanyObj: newCompany, auth: authAcessType): Promise<company> {
    //security check - ensures only admin or elevated roles can make change
    await ensureUserHasAccess(auth)

    newCompanySchema.parse(newCompanyObj)

    //add new request
    const [addedDepartment] = await db.insert(companies).values({
        ...newCompanyObj,
    }).returning()

    return addedDepartment
}

export async function updateCompanies(companyId: company["id"], updatedCompanyObj: Partial<company>, auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    updateCompanySchema.partial().parse(updatedCompanyObj)

    await db.update(companies)
        .set({
            ...updatedCompanyObj
        })
        .where(eq(companies.id, companyId));
}

export async function deleteCompanies(companyId: company["id"], auth: authAcessType) {
    //security check
    await ensureUserHasAccess(auth)

    //validation
    companySchema.shape.id.parse(companyId)

    await db.delete(companies).where(eq(companies.id, companyId));
}

export async function getSpecificCompany(companyId: company["id"], auth: authAcessType): Promise<company | undefined> {
    companySchema.shape.id.parse(companyId)

    //security check
    await ensureUserHasAccess(auth)

    const result = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    return result
}

export async function getCompanies(auth: authAcessType): Promise<company[]> {
    //security check
    await ensureUserHasAccess(auth)

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