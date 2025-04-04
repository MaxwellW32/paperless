"use server"
import { db } from "@/db"
import { companies } from "@/db/schema"
import { company, companySchema, newCompany, newCompanySchema, updateCompanySchema } from "@/types"
import { ensureCanAccessCompany } from "@/utility/sessionCheck"
import { eq } from "drizzle-orm"

export async function addCompanies(newCompanyObj: newCompany): Promise<company> {
    //security check - ensures only admin or elevated roles can make change
    await ensureCanAccessCompany({ companyIdBeingAccessed: "", allowRegularAccess: true })

    newCompanySchema.parse(newCompanyObj)

    //add new request
    const [addedDepartment] = await db.insert(companies).values({
        ...newCompanyObj,
    }).returning()

    return addedDepartment
}

export async function updateCompanies(companyId: company["id"], updatedCompanyObj: Partial<company>) {
    //security check
    await ensureCanAccessCompany({ companyIdBeingAccessed: companyId })

    updateCompanySchema.partial().parse(updatedCompanyObj)

    await db.update(companies)
        .set({
            ...updatedCompanyObj
        })
        .where(eq(companies.id, companyId));
}

export async function deleteCompanies(companyId: company["id"]) {
    //security check
    await ensureCanAccessCompany({ companyIdBeingAccessed: companyId })

    //validation
    companySchema.shape.id.parse(companyId)

    await db.delete(companies).where(eq(companies.id, companyId));
}

export async function getSpecificCompany(companyId: company["id"]): Promise<company | undefined> {
    companySchema.shape.id.parse(companyId)

    //security check
    await ensureCanAccessCompany({ companyIdBeingAccessed: companyId })

    const result = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
    });

    return result
}

export async function getCompanies(): Promise<company[]> {
    //security check
    await ensureCanAccessCompany({ companyIdBeingAccessed: "", allowRegularAccess: true })

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