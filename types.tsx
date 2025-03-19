import { z } from "zod";

// regular types

//recursive form
//basically controlling the look of an element and the data validation
export type recursiveFormMoreFormInfoElementType =
    {
        type: "input",
        isNumeric?: true,
        isFloat?: true,
    } | {
        type: "textarea",
    } | {
        type: "color",
    } | {
        type: "file"
    } | {
        type: "image",
    }
export type recursiveFormMoreInfo = {
    [key: string]: {
        label?: string,
        placeholder?: string,
        element?: recursiveFormMoreFormInfoElementType,
        returnToNull?: true,
        returnToUndefined?: true,
    }
}
export type recursiveFormArrayStarterItems = {
    [key: string]: unknown
}
export type nullishStarters = {
    [key: string]: unknown
}

export const wsWebsiteUpdateSchema = z.object({
    type: z.literal("website"),
});
export type wsWebsiteUpdateType = z.infer<typeof wsWebsiteUpdateSchema>

export const wsPageUpdateSchema = z.object({
    type: z.literal("page"),
    pageId: z.string().min(1),
    refresh: z.boolean()
});
export type wsPageUpdateType = z.infer<typeof wsPageUpdateSchema>

export const wsUsedComponentUpdateSchema = z.object({
    type: z.literal("usedComponent"),
    usedComponentId: z.string().min(1),
    refresh: z.boolean() //wait till user not editing to refresh
});
export type wsUsedComponentUpdateType = z.infer<typeof wsUsedComponentUpdateSchema>

export const weWsUpdatedUnionSchema = z.union([wsWebsiteUpdateSchema, wsPageUpdateSchema, wsUsedComponentUpdateSchema])
export type weWsUpdatedUnionType = z.infer<typeof weWsUpdatedUnionSchema>

export const webSocketStandardMessageSchema = z.object({
    type: z.literal("standard"),
    // data: z.object({
    //     websiteId: z.string(),
    //     updated: weWsUpdatedUnionSchema
    // })
});
export type webSocketStandardMessageType = z.infer<typeof webSocketStandardMessageSchema>

export const webSocketMessageJoinSchema = z.object({
    type: z.literal("join"),
    // websiteId: z.string(),
});
export type webSocketMessageJoinType = z.infer<typeof webSocketMessageJoinSchema>

export const webSocketMessagePingSchema = z.object({
    type: z.literal("ping"),
});
export type webSocketMessagePingType = z.infer<typeof webSocketMessagePingSchema>

export const webSocketMessageSchema = z.union([webSocketStandardMessageSchema, webSocketMessageJoinSchema, webSocketMessagePingSchema])
export type webSocketMessageType = z.infer<typeof webSocketMessageSchema>



const requestTypeSchema = z.enum(["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "equipmentOther"])
export type requestType = z.infer<typeof requestTypeSchema>

export const tapeDepositRequestSchema = z.object({
    type: z.literal(requestTypeSchema.Values.tapeDeposit),
});
export type tapeDepositRequestType = z.infer<typeof tapeDepositRequestSchema>




export const tapeWithdrawRequestSchema = z.object({
    type: z.literal(requestTypeSchema.Values.tapeWithdraw),
});
export type tapeWithdrawRequestType = z.infer<typeof tapeWithdrawRequestSchema>




export const equipmentDepositRequestSchema = z.object({
    type: z.literal(requestTypeSchema.Values.equipmentDeposit),
});
export type equipmentDepositRequestType = z.infer<typeof equipmentDepositRequestSchema>




export const equipmentWithdrawRequestSchema = z.object({
    type: z.literal(requestTypeSchema.Values.equipmentWithdraw),
});
export type equipmentWithdrawRequestType = z.infer<typeof equipmentWithdrawRequestSchema>




export const equipmentOtherRequestSchema = z.object({
    type: z.literal(requestTypeSchema.Values.equipmentOther),
});
export type equipmentOtherRequestType = z.infer<typeof equipmentOtherRequestSchema>




export const clientRequestDataSchema = z.union([tapeDepositRequestSchema, tapeWithdrawRequestSchema, equipmentDepositRequestSchema, equipmentWithdrawRequestSchema, equipmentOtherRequestSchema])
export type clientRequestDataType = z.infer<typeof clientRequestDataSchema>



















//keep synced with db schema
export const userAccessSchema = z.enum(["admin"])

export const userSchema = z.object({
    id: z.string().min(1),
    fromDepartment: z.boolean(),
    phoneNumbers: z.array(z.string().min(1)),

    accessLevel: userAccessSchema.nullable(),
    name: z.string().min(1).nullable(),
    image: z.string().min(1).nullable(),
    email: z.string().min(1).nullable(),
    emailVerified: z.date().nullable(),
})
export type user = z.infer<typeof userSchema> & {
    usersToDepartments?: userToDepartment[],
    usersToCompanies?: userToCompany[],
}

export const adminUpdateUserSchema = userSchema.omit({ id: true, emailVerified: true, })
export type adminUpdateUser = z.infer<typeof adminUpdateUserSchema>

export const updateUserSchema = userSchema.omit({ id: true, accessLevel: true, emailVerified: true, })
export type updateUser = z.infer<typeof updateUserSchema>




export const departmentSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
})
export type department = z.infer<typeof departmentSchema> & {
    usersToDepartments?: userToDepartment[],
}

export const updateDepartmentSchema = departmentSchema.omit({ id: true })
export type updateDepartment = z.infer<typeof updateDepartmentSchema>




export const companySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    location: z.string().min(1),
    emails: z.array(z.string().min(1)).min(1),
    phones: z.array(z.string().min(1)).min(1),
    faxes: z.array(z.string().min(1)),
})
export type company = z.infer<typeof companySchema> & {
    usersToCompanies?: userToCompany[],
}

export const updateCompanySchema = companySchema.omit({ id: true })
export type updateCompany = z.infer<typeof updateCompanySchema>




export const equipmentSchema = z.object({
    id: z.string().min(1),
    quantity: z.number(),
    makeModel: z.string().min(1),
    serialNumber: z.string().min(1),
    additionalNotes: z.string(),
    powerSupplyCount: z.number(),
    rackUnits: z.number(),
    companyId: companySchema.shape.id,

    amps: z.string().min(1).nullable(),
    weight: z.string().min(1).nullable(),
})
export type equipmet = z.infer<typeof equipmentSchema> & {
}

export const updateEquipmentSchema = equipmentSchema.omit({ id: true })
export type updateEquipment = z.infer<typeof updateEquipmentSchema>




export const tapeSchema = z.object({
    id: z.string().min(1),
    mediaLabel: z.string().min(1),
    initial: z.string().min(1),
    companyId: z.string().min(1),
})
export type tape = z.infer<typeof tapeSchema> & {
}

export const updateTapeSchema = tapeSchema.omit({ id: true })
export type updateTape = z.infer<typeof updateTapeSchema>




//keep synced with db schema
export const clientRequestStatusSchema = z.enum(["in-progress", "completed", "cancelled", "on-hold"])

export const clientRequestSchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id,
    companyId: companySchema.shape.id,
    data: clientRequestDataSchema,
    status: clientRequestStatusSchema,
})
export type clientRequest = z.infer<typeof clientRequestSchema> & {
    user?: user,
    company?: company,
}

export const adminUpdateClientRequestSchema = clientRequestSchema.omit({ id: true, })
export type adminUpdateClientRequest = z.infer<typeof adminUpdateClientRequestSchema>

export const updateClientRequestSchema = clientRequestSchema.omit({ id: true, userId: true, companyId: true })
export type updateClientRequest = z.infer<typeof updateClientRequestSchema>




















//keep synced with db schema
export const userDepartmentRoleSchema = z.enum(["head", "elevated", "regular"])

export const userToDepartmentSchema = z.object({
    userId: z.string().min(1),
    departmentId: z.string().min(1),
    departmentRole: userDepartmentRoleSchema,
})
export type userToDepartment = z.infer<typeof userToDepartmentSchema> & {
}

export const updateUserToDepartmentSchema = userToDepartmentSchema.omit({ userId: true, departmentId: true, departmentRole: true })
export type updateUserToDepartment = z.infer<typeof updateUserToDepartmentSchema>




//keep synced with db schema
export const userCompanyRoleSchema = z.enum(["head", "elevated", "regular"])

export const userToCompanySchema = z.object({
    userId: z.string().min(1),
    companyId: z.string().min(1),
    companyRole: userCompanyRoleSchema,
    onAccessList: z.boolean(),
})
export type userToCompany = z.infer<typeof userToCompanySchema> & {
}

export const updateUserToCompanySchema = userToCompanySchema.omit({ userId: true, companyId: true, companyRole: true })
export type updateUserToCompany = z.infer<typeof updateUserToCompanySchema>























