"use server"
import { db } from "@/db";
import { users } from "@/db/schema";
import { updateUser, updateUserSchema, user, userSchema } from "@/types";
import { eq, like } from "drizzle-orm";
import { ensureUserIsAdmin, sessionCheckWithError } from "./handleAuth";

export async function updateTheUser(userId: user["id"], userObj: Partial<updateUser>): Promise<user> {
    await sessionCheckWithError()

    //validation
    updateUserSchema.partial().parse(userObj)

    const [result] = await db.update(users)
        .set({
            ...userObj
        })
        .where(eq(users.id, userId)).returning()

    return result
}

export async function getSpecificUser(userId: user["id"]): Promise<user | undefined> {
    await sessionCheckWithError()

    userSchema.shape.id.parse(userId)

    const result = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
            usersToCompanies: {
                with: {
                    company: true,
                }
            },
            usersToDepartments: {
                with: {
                    department: true,
                }
            }
        }
    });

    return result
}


export async function getUsers(option: { type: "name", name: string } | { type: "all" }, limit = 50, offset = 0): Promise<user[]> {
    await ensureUserIsAdmin()

    if (option.type === "name") {
        const results = await db.query.users.findMany({
            limit: limit,
            offset: offset,
            where: like(users.name, `%${option.name.toLowerCase()}%`),
        });

        return results

    } else if (option.type === "all") {
        const results = await db.query.users.findMany({
            limit: limit,
            offset: offset,
        });

        return results

    } else {
        throw new Error("invalid selection")
    }
}