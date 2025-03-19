"use server"
import { db } from "@/db";
import { users } from "@/db/schema";
import { updateUser, updateUserSchema, user, userSchema } from "@/types";
import { sessionCheckWithError } from "@/utility/sessionCheck";
import { eq } from "drizzle-orm";
// import { v4 as uuidV4 } from "uuid";

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

export async function getUser(userId: user["id"]): Promise<user | undefined> {
    await sessionCheckWithError()

    userSchema.shape.id.parse(userId)

    const result = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    return result
}
