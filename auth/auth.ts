import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/nodemailer"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db";
import { accounts, sessions, users } from "@/db/schema";
require('dotenv').config()

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        EmailProvider({
            server: {
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                }
            },
            from: process.env.EMAIL_SERVER_USER
        })
    ],
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id; // Store user ID in the token
            }

            return token;
        },
        session({ session, token }) {
            if (token?.id) {
                // @ts-expect-error type
                session.user.id = token.id; // Pass the user ID to the session
            }

            return session;
        }
    },
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
    }),
})