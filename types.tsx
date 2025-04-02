import { array, z } from "zod";

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

export type authAcessType = { departmentIdBeingAccessed?: department["id"], companyIdBeingAccessed?: company["id"], allowRegularAccess?: boolean }


export type departmentCompanySelection = {
    type: "department",
    departmentId: string
} | {
    type: "company",
    companyId: string
}

export type refreshObjType = { [key: string]: boolean }


























export type formInputType = {
    type: "input";
    label: string;
    required: boolean,
    data: { type: "string"; value: string, placeholder: string, useTextArea: boolean }
    | { type: "number", placeholder: string, value: number, isFloat: boolean }
    | { type: "boolean"; value: boolean }
    | { type: "date"; value: string },
};

export type formInputObjType = {
    type: "object";
    label: string;
    required: boolean,
    data: formType;
};

export type formInputArrType = {
    type: "array";
    label: string;
    required: boolean,
    arrayStarter: formType,
    arrayAddLabel: string,
    data: formType[];
};

export type formType = { [key: string]: formInputType | formInputObjType | formInputArrType; }


export const formSchema: z.ZodType<formType> = z.lazy(() =>
    z.record(z.string(), z.union([formInputSchema, formInputObjSchema, formInputArrSchema]))
);

export const formInputSchema = z.object({
    type: z.literal("input"),
    label: z.string(),
    required: z.boolean(),
    data: z.union([
        z.object({ type: z.literal("string"), value: z.string(), placeholder: z.string(), useTextArea: z.boolean() }),
        z.object({ type: z.literal("number"), value: z.number(), placeholder: z.string(), isFloat: z.boolean() }),
        z.object({ type: z.literal("boolean"), value: z.boolean() }),
        z.object({ type: z.literal("date"), value: z.string() }),
    ]),
});

export const formInputObjSchema = z.object({
    type: z.literal("object"),
    label: z.string(),
    required: z.boolean(),
    data: formSchema,
});

export const formInputArrSchema = z.object({
    type: z.literal("array"),
    label: z.string(),
    required: z.boolean(),
    arrayStarter: formSchema,
    arrayAddLabel: z.string(),
    data: z.array(formSchema),
});

export const checklistItemFormSchema = z.object({
    type: z.literal("form"),
    data: formSchema,
    completed: z.boolean(),
})
export type checklistItemFormType = z.infer<typeof checklistItemFormSchema>

export const checklistItemEmailSchema = z.object({
    type: z.literal("email"),
    to: z.string().min(1),
    subject: z.string().min(1),
    email: z.string().min(1),
    completed: z.boolean(),
})
export type checklistItemEmailType = z.infer<typeof checklistItemEmailSchema>

export const checklistItemManualSchema = z.object({
    type: z.literal("manual"),
    prompt: z.string().min(1),
    completed: z.boolean(),
})
export type checklistItemManualType = z.infer<typeof checklistItemManualSchema>

export const checklistItemSchema = z.union([checklistItemFormSchema, checklistItemEmailSchema, checklistItemManualSchema])
export type checklistItemType = z.infer<typeof checklistItemSchema>















//keep synced with db schema
export const userAccessSchema = z.enum(["admin"])

export const userSchema = z.object({
    id: z.string().min(1),
    fromDepartment: z.boolean(),

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
    emails: z.array(z.string().min(1)).min(1),
    phones: z.array(z.string().min(1)).min(1),
})
export type department = z.infer<typeof departmentSchema> & {
    usersToDepartments?: userToDepartment[],
}

export const updateDepartmentSchema = departmentSchema.omit({ id: true })
export type updateDepartment = z.infer<typeof updateDepartmentSchema>

export const newDepartmentSchema = departmentSchema.omit({ id: true })
export type newDepartment = z.infer<typeof newDepartmentSchema>




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

export const newCompanySchema = companySchema.omit({ id: true })
export type newCompany = z.infer<typeof newCompanySchema>




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
    companyId: companySchema.shape.id,
})
export type tape = z.infer<typeof tapeSchema> & {
}

export const newTapeSchema = tapeSchema.omit({ id: true, companyId: true })
export type newTape = z.infer<typeof newTapeSchema>

export const updateTapeSchema = tapeSchema.omit({ id: true })
export type updateTape = z.infer<typeof updateTapeSchema>




//keep synced with db schema
// export const clientRequestTypeSchema = z.enum(["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "equipmentOther"])
// export type clientRequestType = z.infer<typeof clientRequestTypeSchema>

export const checklistStarterSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    checklist: z.array(checklistItemSchema),
})
export type checklistStarter = z.infer<typeof checklistStarterSchema>

export const newChecklistStarterSchema = checklistStarterSchema.omit({ id: true })
export type newChecklistStarter = z.infer<typeof newChecklistStarterSchema>

export const updateChecklistStarterSchema = checklistStarterSchema.omit({ id: true })
export type updateChecklistStarter = z.infer<typeof updateChecklistStarterSchema>



















// export const tapeDepositRequestSchema = z.object({
//     type: z.literal(clientRequestTypeSchema.Values.tapeDeposit),
//     data: z.object({
//         newTapes: z.array(newTapeSchema).min(1, "need at least one tape to deposit")
//     }),
// });
// export type tapeDepositRequestType = z.infer<typeof tapeDepositRequestSchema>

// export const tapeWithdrawRequestSchema = z.object({
//     type: z.literal(clientRequestTypeSchema.Values.tapeWithdraw),
// });
// export type tapeWithdrawRequestType = z.infer<typeof tapeWithdrawRequestSchema>

// export const equipmentDepositRequestSchema = z.object({
//     type: z.literal(clientRequestTypeSchema.Values.equipmentDeposit),
// });
// export type equipmentDepositRequestType = z.infer<typeof equipmentDepositRequestSchema>

// export const equipmentWithdrawRequestSchema = z.object({
//     type: z.literal(clientRequestTypeSchema.Values.equipmentWithdraw),
// });
// export type equipmentWithdrawRequestType = z.infer<typeof equipmentWithdrawRequestSchema>

// export const equipmentOtherRequestSchema = z.object({
//     type: z.literal(clientRequestTypeSchema.Values.equipmentOther),
// });
// export type equipmentOtherRequestType = z.infer<typeof equipmentOtherRequestSchema>

// export const clientRequestDataSchema = z.union([tapeDepositRequestSchema, tapeWithdrawRequestSchema, equipmentDepositRequestSchema, equipmentWithdrawRequestSchema, equipmentOtherRequestSchema])
// export type clientRequestDataType = z.infer<typeof clientRequestDataSchema>




//keep synced with db schema
export const clientRequestStatusSchema = z.enum(["in-progress", "completed", "cancelled", "on-hold"])
export type clientRequestStatusType = z.infer<typeof clientRequestStatusSchema>

export const clientRequestSchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id, //who sent the request
    companyId: companySchema.shape.id, //what company is it on behalf of
    dateSubmitted: z.date(),
    status: clientRequestStatusSchema,
    checklist: z.array(checklistItemSchema).min(1),
    checklistStarterId: checklistStarterSchema.shape.id,
})
export type clientRequest = z.infer<typeof clientRequestSchema> & {
    user?: user,
    company?: company,
    checklistStarter?: checklistStarter
}

export const updateClientRequestSchema = clientRequestSchema.omit({ id: true, userId: true, companyId: true, checklistStarterId: true, dateSubmitted: true })
export type updateClientRequest = z.infer<typeof updateClientRequestSchema>

export const newClientRequestSchema = clientRequestSchema.omit({ id: true, userId: true, status: true, dateSubmitted: true })
export type newClientRequest = z.infer<typeof newClientRequestSchema>



















//keep synced with db schema
export const userDepartmentRoleSchema = z.enum(["head", "elevated", "regular"])

export const userToDepartmentSchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id,
    departmentId: departmentSchema.shape.id,
    departmentRole: userDepartmentRoleSchema,
    contactNumbers: z.array(z.string().min(1)).min(1),
    contactEmails: z.array(z.string().min(1)).min(1),
})
export type userToDepartment = z.infer<typeof userToDepartmentSchema> & {
    user?: user,
    department?: department
}

export const newUserToDepartmentSchema = userToDepartmentSchema.omit({ id: true })
export type newUserToDepartment = z.infer<typeof newUserToDepartmentSchema>

export const updateUserToDepartmentSchema = userToDepartmentSchema.omit({ id: true, userId: true, departmentId: true })
export type updateUserToDepartment = z.infer<typeof updateUserToDepartmentSchema>




//keep synced with db schema
export const userCompanyRoleSchema = z.enum(["head", "elevated", "regular"])

export const userToCompanySchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id,
    companyId: companySchema.shape.id,
    companyRole: userCompanyRoleSchema,
    onAccessList: z.boolean(),
    contactNumbers: z.array(z.string().min(1)).min(1),
    contactEmails: z.array(z.string().min(1)).min(1),
})
export type userToCompany = z.infer<typeof userToCompanySchema> & {
    user?: user,
    company?: company
}

export const newUserToCompanySchema = userToCompanySchema.omit({ id: true, })
export type newUserToCompany = z.infer<typeof newUserToCompanySchema>

export const updateUserToCompanySchema = userToCompanySchema.omit({ id: true, userId: true, companyId: true })
export type updateUserToCompany = z.infer<typeof updateUserToCompanySchema>