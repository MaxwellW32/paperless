"use server"
import { auth } from "@/auth/auth"
import { db } from "@/db"
import { usersToCompanies } from "@/db/schema"
import { newUserToCompany, newUserToCompanySchema, updateUserToCompany, updateUserToCompanySchema, user, userToCompany, userToCompanySchema } from "@/types"
import { sessionCheckWithError } from "@/utility/sessionCheck"
import { eq } from "drizzle-orm"
import { getUser } from "./handleUser"

export async function addUserToCompany(newUserToCompanyObj: newUserToCompany): Promise<userToCompany> {
    const session = await sessionCheckWithError()

    newUserToCompanySchema.parse(newUserToCompanyObj)

    const addedWebsite = await db.insert(usersToCompanies).values({
        ...newUserToCompanyObj,
        userId: session.user.id
    }).returning()

    return addedWebsite[0]
}

export async function updateUserToCompany(seenUser: user, userToCompanyId: userToCompany["id"], updatedUserToCompanyObj: Partial<updateUserToCompany>) {
    //security check - ensures only admin or author can update
    const session = await auth()
    if (session === null) throw new Error("need session")

    //security on whos doing the update
    //write to database the sent user

    //security
    if (session.user.accessLevel !== "admin") {
        //are they from an egov department
        if (session.user.fromDepartment) {
            // const seenUsersToDepartments = getUsersToDepartments

            if (session.user.usersToDepartments) {

            } else {
                //are they a manager making a change
                const seenUsersToCompanies = getUsersToDepartments

            }
        }

    }


    updateUserToCompanySchema.partial().parse(updatedUserToCompanyObj)

    await db.update(usersToCompanies)
        .set({
            ...updatedUserToCompanyObj
        })
        .where(eq(usersToCompanies.id, userToCompanyId));
}

export async function deleteUserToCompany(userToCompanyId: userToCompany["id"],) {
    //validation
    userToCompanySchema.shape.id.parse(userToCompanyId)

    //security check

    await db.delete(usersToCompanies).where(eq(usersToCompanies.id, userToCompanyId));
}

export async function getSpecificWebsite(websiteObj: { option: "id", data: Pick<website, "id"> } | { option: "name", data: Pick<website, "name"> }, websiteOnly?: boolean): Promise<website | undefined> {
    if (websiteObj.option === "id") {
        websiteSchema.pick({ id: true }).parse(websiteObj.data)

        const result = await db.query.websites.findFirst({
            where: eq(websites.id, websiteObj.data.id),
            with: websiteOnly ? undefined : {
                pages: true,
                usedComponents: {
                    with: {
                        template: true
                    }
                }
            }
        });

        if (result !== undefined) {
            //security check
            await ensureUserCanAccessWebsite(result.userId, result.authorisedUsers)
        }

        return result

    } else if (websiteObj.option === "name") {
        websiteSchema.pick({ name: true }).parse(websiteObj.data)

        const result = await db.query.websites.findFirst({
            where: eq(websites.name, websiteObj.data.name),
            with: websiteOnly ? undefined : {
                pages: true,
                usedComponents: {
                    with: {
                        template: true
                    }
                }
            }
        });

        if (result !== undefined) {
            //security check
            await ensureUserCanAccessWebsite(result.userId, result.authorisedUsers)
        }

        return result
    }
}

export async function getWebsitesFromUser(): Promise<website[]> {
    const session = await sessionCheckWithError()

    const results = await db.query.websites.findMany({
        where: eq(websites.userId, session.user.id)
    })

    return results
}