import { checklistItemType } from "@/types";
import { relations } from "drizzle-orm";
import { timestamp, pgTable, text, primaryKey, integer, varchar, pgEnum, json, index, boolean } from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const accessLevelEnum = pgEnum("accessLevel", ["admin"]);

export const users = pgTable("users", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    fromDepartment: boolean("fromDepartment").notNull().default(false),
    accessLevel: accessLevelEnum(),

    name: varchar("name", { length: 255 }),
    image: text("image"),
    email: varchar("email", { length: 255 }).unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
})
export const usersRelations = relations(users, ({ many }) => ({
    usersToDepartments: many(usersToDepartments),
    usersToCompanies: many(usersToCompanies),
}));




//egov department
export const departments = pgTable("departments", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull().unique(),
})
export const departmentsRelations = relations(departments, ({ many }) => ({
    usersToDepartments: many(usersToDepartments),
}));



//client company list
export const companies = pgTable("companies", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull().unique(),
    location: varchar("location", { length: 255 }).notNull(),
    emails: json("emails").$type<string[]>().notNull(),
    phones: json("phones").$type<string[]>().notNull(),
    faxes: json("faxes").$type<string[]>().notNull(),
})
export const companiesRelations = relations(companies, ({ many }) => ({
    usersToCompanies: many(usersToCompanies),
}));




export const equipment = pgTable("equipment", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    quantity: integer("quantity").notNull(),
    makeModel: varchar("makeModel", { length: 255 }).notNull(),
    serialNumber: varchar("serialNumber", { length: 255 }).notNull(),
    additionalNotes: text("additionalNotes").notNull().default(""),
    powerSupplyCount: integer("powerSupplyCount").notNull(),
    rackUnits: integer("rackUnits").notNull(),
    companyId: varchar("companyId", { length: 255 }).notNull().references(() => companies.id),

    amps: varchar("amps", { length: 255 }),
    weight: varchar("weight", { length: 255 }),
})
export const equipmentRelations = relations(equipment, ({ many }) => ({
}));




export const tapes = pgTable("tapes", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    mediaLabel: varchar("mediaLabel", { length: 255 }).notNull(),
    initial: varchar("initial", { length: 255 }).notNull(),
    companyId: varchar("companyId", { length: 255 }).notNull().references(() => companies.id),
})
export const tapesRelations = relations(tapes, ({ many }) => ({
}));





// export const clientRequestTypeEnum = pgEnum("type", ["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "equipmentOther"]);

export const checklistStarters = pgTable("checklistStarters", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: varchar("type", { length: 255 }).notNull().unique(),
    checklist: json("checklist").$type<checklistItemType[]>().notNull(),
})
export const checklistStartersRelations = relations(checklistStarters, ({ one }) => ({
}));



export const clientRequestStatusEnum = pgEnum("status", ["in-progress", "completed", "cancelled", "on-hold"]);

export const clientRequests = pgTable("clientRequests", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id),
    companyId: varchar("companyId", { length: 255 }).notNull().references(() => companies.id),
    status: clientRequestStatusEnum().notNull(),
    checklist: json("checklist").$type<checklistItemType[]>().notNull(),
})
export const clientRequestsRelations = relations(clientRequests, ({ one }) => ({
    user: one(users, {
        fields: [clientRequests.userId],
        references: [users.id],
    }),
    company: one(companies, {
        fields: [clientRequests.companyId],
        references: [companies.id],
    }),
}));








export const userDepartmentRoleEnum = pgEnum("departmentRole", ["head", "elevated", "regular"]);

export const usersToDepartments = pgTable("usersToDepartments", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id),
    departmentId: varchar("departmentId", { length: 255 }).notNull().references(() => departments.id),
    departmentRole: userDepartmentRoleEnum().notNull().default("regular"),
    contactNumbers: json("contactNumbers").$type<string[]>().notNull(),
    contactEmails: json("contactEmails").$type<string[]>().notNull(),
})
export const usersToDepartmentsRelations = relations(usersToDepartments, ({ one }) => ({
    user: one(users, {
        fields: [usersToDepartments.userId],
        references: [users.id],
    }),
    department: one(departments, {
        fields: [usersToDepartments.departmentId],
        references: [departments.id],
    }),
}));





export const userCompanyRoleEnum = pgEnum("companyRole", ["head", "elevated", "regular"]);

export const usersToCompanies = pgTable("usersToCompanies", {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 }).notNull().references(() => users.id),
    companyId: varchar("companyId", { length: 255 }).notNull().references(() => companies.id),
    companyRole: userCompanyRoleEnum().notNull().default("regular"),
    onAccessList: boolean("onAccessList").notNull().default(false),
    contactNumbers: json("contactNumbers").$type<string[]>().notNull(),
    contactEmails: json("contactEmails").$type<string[]>().notNull(),
})
export const usersToCompaniesRelations = relations(usersToCompanies, ({ one }) => ({
    user: one(users, {
        fields: [usersToCompanies.userId],
        references: [users.id],
    }),
    company: one(companies, {
        fields: [usersToCompanies.companyId],
        references: [companies.id],
    }),
}));






export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
)

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
)