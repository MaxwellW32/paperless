"use server"
import { db } from "@/db";
import { users } from "@/db/schema";
import { newUser, newUserSchema, updateUser, updateUserSchema, user, userSchema } from "@/types";
import { eq, sql } from "drizzle-orm";
import { ensureUserIsAdmin, sessionCheckWithError } from "./handleAuth";

export async function addUsers(newUserObj: newUser): Promise<user> {
    //security check  
    await ensureUserIsAdmin()

    newUserSchema.parse(newUserObj)

    //add new request
    const [addedUser] = await db.insert(users).values({
        ...newUserObj,
    }).returning()

    return addedUser
}

export async function updateUsers(userId: user["id"], userObj: Partial<updateUser>): Promise<user> {
    await ensureUserIsAdmin()

    //validation
    updateUserSchema.partial().parse(userObj)

    const [result] = await db.update(users)
        .set({
            ...userObj
        })
        .where(eq(users.id, userId)).returning()

    return result
}

export async function getSpecificUsers(userId: user["id"]): Promise<user | undefined> {
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
            where: (
                sql`LOWER(${users.name}) LIKE LOWER(${`%${option.name}%`})`
            )
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

export async function deleteUsers(userId: user["id"]) {
    //security check
    await ensureUserIsAdmin()

    //validation
    userSchema.shape.id.parse(userId)

    await db.delete(users).where(eq(users.id, userId));
}
