import { Session } from "next-auth";
import { z } from "zod";

//5 space - new purpose types
//1 space - similar but clarity
//no space - show closeness

//resources are shared database models - tables updated by different users
export type resourceAuthType = { compantyIdForAuth?: company["id"], departmentIdForAuth?: department["id"] }
export type resourceAuthResponseType = { [key in crudOptionType]: boolean | undefined }
export type expectedResourceType =
    {
        type: "admin",
    } | {
        type: "company",
        companyId: company["id"]
    } | {
        type: "department",
        departmentId: department["id"]
    } | {
        type: "clientRequests",
        clientRequestId: clientRequest["id"]
    } | {
        type: "tape",
        tapeId: tape["id"]
    } | {
        type: "equipment",
        equipmentId: equipmentT["id"]
    }



//handle user selection - company/department/admin user
export type userDepartmentCompanySelection = {
    type: "userDepartment",
    seenUserToDepartment: userToDepartment
} | {
    type: "userCompany",
    seenUserToCompany: userToCompany
}



//dashboard types
export type refreshObjType = { [key: string]: boolean }
export type refreshWSObjType = { [key: string]: boolean }

export type activeScreenType = {
    type: "newRequest",
    activeChecklistStarterType: checklistStarter["type"] | undefined
} | {
    type: "editRequest",
    oldClientRequest: clientRequest
} | {
    type: "viewRequest",
    clientRequestId: clientRequest["id"]
}



//handle auth all in one place - what operation are you doing, and what access level do you have
export type authAccessLevelResponseType = { session: Session, accessLevel: userDepartmentAccessLevel | companyAccessLevel }
export type crudOptionType = "c" | "r" | "ra" | "u" | "d"



//handle search component with limits/offsets
export type searchObj<T> = {
    searchItems: T[],
    limit?: number, //how many
    offset?: number, //increaser
    incrementOffsetBy?: number, //how much to increase by
    refreshAll?: boolean
}



export type baseDynamicFormInputType = {
    type: "input";
    label: string;
    required: boolean,
    data: { type: "string"; value: string, placeholder: string, useTextArea: boolean }
    | { type: "number", placeholder: string, value: number, isFloat: boolean }
    | { type: "boolean"; value: boolean }
    | { type: "date"; value: string },
};
export type baseDynamicFormInputObjType = {
    type: "object";
    label: string;
    required: boolean,
    data: baseDynamicFormType;
};
export type baseDynamicFormInputArrType = {
    type: "array";
    label: string;
    required: boolean,
    arrayStarter: baseDynamicFormType,
    arrayAddLabel: string,
    data: baseDynamicFormType[];
};
export type baseDynamicFormType = { [key: string]: baseDynamicFormInputType | baseDynamicFormInputObjType | baseDynamicFormInputArrType; }

export const baseDynamicFormSchema: z.ZodType<baseDynamicFormType> = z.lazy(() =>
    z.record(z.string(), z.union([baseDynamicFormInputSchema, baseDynamicFormInputObjSchema, baseDynamicFormInputArrSchema]))
);
export const baseDynamicFormInputSchema = z.object({
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
export const baseDynamicFormInputObjSchema = z.object({
    type: z.literal("object"),
    label: z.string(),
    required: z.boolean(),
    data: baseDynamicFormSchema,
});
export const baseDynamicFormInputArrSchema = z.object({
    type: z.literal("array"),
    label: z.string(),
    required: z.boolean(),
    arrayStarter: baseDynamicFormSchema,
    arrayAddLabel: z.string(),
    data: z.array(baseDynamicFormSchema),
});















































//keep synced with db schema
export const userAccessSchema = z.enum(["admin"])
export type userAccessLevel = z.infer<typeof userAccessSchema>

export const userSchema = z.object({
    id: z.string().min(1),
    fromDepartment: z.boolean(),

    accessLevel: userAccessSchema.nullable(),
    name: z.string().min(1).nullable(),
    image: z.string().min(1).nullable(),
    email: z.string().min(1).email().nullable(),
    emailVerified: z.date().nullable(),
})
export type user = z.infer<typeof userSchema> & {
    usersToDepartments?: userToDepartment[],
    usersToCompanies?: userToCompany[],
}

export const updateUserSchema = userSchema.omit({ id: true, emailVerified: true })
export type updateUser = z.infer<typeof updateUserSchema>

export const newUserSchema = userSchema.omit({ id: true, emailVerified: true })
export type newUser = z.infer<typeof newUserSchema>




export const departmentSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    emails: z.array(z.string().min(1).email()).min(1),
    phones: z.array(z.string().min(1)).min(1),
    canManageRequests: z.boolean(),
})
export type department = z.infer<typeof departmentSchema> & {
    usersToDepartments?: userToDepartment[],
}

//admin
export const updateDepartmentSchema = departmentSchema.omit({ id: true })
export type updateDepartment = z.infer<typeof updateDepartmentSchema>

//department admin
export const smallAdminUpdateDepartmentSchema = updateDepartmentSchema.omit({ canManageRequests: true })
export type smallAdminUpdateDepartment = z.infer<typeof smallAdminUpdateDepartmentSchema>

export const newDepartmentSchema = departmentSchema.omit({ id: true })
export type newDepartment = z.infer<typeof newDepartmentSchema>




export const companySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    location: z.string().min(1),
    emails: z.array(z.string().min(1).email()).min(1),
    phones: z.array(z.string().min(1)).min(1),
    faxes: z.array(z.string().min(1)),
})
export type company = z.infer<typeof companySchema> & {
    usersToCompanies?: userToCompany[],
}

//admin
export const updateCompanySchema = companySchema.omit({ id: true })
export type updateCompany = z.infer<typeof updateCompanySchema>

//department admin
export const smallAdminUpdateCompanySchema = updateCompanySchema.omit({})
export type smallAdminUpdateCompany = z.infer<typeof smallAdminUpdateCompanySchema>

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
    equipmentLocation: z.string().min(1),
    dateAdded: z.date(),

    amps: z.string().min(1).nullable(),
    weight: z.string().min(1).nullable(),
})
export type equipmentT = z.infer<typeof equipmentSchema> & {
    company?: company
}

export const newEquipmentSchema = equipmentSchema.omit({ id: true, dateAdded: true })
export type newEquipmentT = z.infer<typeof newEquipmentSchema>

export const updateEquipmentSchema = equipmentSchema.omit({ id: true, dateAdded: true })
export type updateEquipmentT = z.infer<typeof updateEquipmentSchema>



//keep synced with db schema
export const tapeLocationSchema = z.enum(["in-vault", "with-client"])
export type tapeLocation = z.infer<typeof tapeLocationSchema>

export const tapeSchema = z.object({
    id: z.string().min(1),
    mediaLabel: z.string().min(1),
    initial: z.string().min(1),
    companyId: companySchema.shape.id,
    dateAdded: z.date(),
    tapeLocation: tapeLocationSchema,
})
export type tape = z.infer<typeof tapeSchema> & {
    company?: company
}

export const newTapeSchema = tapeSchema.omit({ id: true, dateAdded: true })
export type newTape = z.infer<typeof newTapeSchema>

export const updateTapeSchema = tapeSchema.omit({ id: true, dateAdded: true })
export type updateTape = z.infer<typeof updateTapeSchema>


























export const formTypesSchema = z.enum(["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "dynamic"])
export type formTypesType = z.infer<typeof formTypesSchema>

export const tapeFormNewTapeSchema = newTapeSchema.extend({
    id: tapeSchema.shape.id.optional(),
});
export type tapeFormNewTapeType = z.infer<typeof tapeFormNewTapeSchema>;
export const tapeFormSchema = z.object({
    type: z.union([z.literal(formTypesSchema.Values.tapeDeposit), z.literal(formTypesSchema.Values.tapeWithdraw)]),
    data: z.object({
        tapesInRequest: z.array(tapeFormNewTapeSchema).min(1, "need at least one tape for request"),
    }).nullable(),
});
export type tapeFormType = z.infer<typeof tapeFormSchema>

export const equipmentFormNewEquipmentSchema = newEquipmentSchema.extend({
    id: equipmentSchema.shape.id.optional(),
});
export type equipmentFormNewEquipmentType = z.infer<typeof equipmentFormNewEquipmentSchema>;
export const equipmentFormSchema = z.object({
    type: z.union([z.literal(formTypesSchema.Values.equipmentDeposit), z.literal(formTypesSchema.Values.equipmentWithdraw)]),
    data: z.object({
        equipmentInRequest: z.array(equipmentFormNewEquipmentSchema).min(1, "need at least one item for request"),
    }).nullable(),
});
export type equipmentFormType = z.infer<typeof equipmentFormSchema>

export const dynamicFormSchema = z.object({
    type: z.literal("dynamic"),
    data: baseDynamicFormSchema
})
export type dynamicFormType = z.infer<typeof dynamicFormSchema>




export const checklistItemFormDataSchema = z.union([tapeFormSchema, equipmentFormSchema, dynamicFormSchema])
export type checklistItemFormDataType = z.infer<typeof checklistItemFormDataSchema>




export const checklistItemFormSchema = z.object({
    type: z.literal("form"),
    form: checklistItemFormDataSchema,
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
    for: z.union([
        z.object({
            type: z.literal("department"),
            departmenId: z.string().min(1)
        }),
        z.object({
            type: z.literal("company"),
            companyId: z.string().min(1)
        }),
    ]),
    prompt: z.string().min(1),
    completed: z.boolean(),
})
export type checklistItemManualType = z.infer<typeof checklistItemManualSchema>




export const checklistItemSchema = z.union([checklistItemFormSchema, checklistItemEmailSchema, checklistItemManualSchema])
export type checklistItemType = z.infer<typeof checklistItemSchema>




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



//keep synced with db schema
export const clientRequestStatusSchema = z.enum(["in-progress", "completed", "cancelled", "on-hold"])
export type clientRequestStatusType = z.infer<typeof clientRequestStatusSchema>

//add access list
export const clientRequestSchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id, //who sent the request
    companyId: companySchema.shape.id, //what company is it on behalf of
    dateSubmitted: z.string().datetime(),
    status: clientRequestStatusSchema,
    checklist: z.array(checklistItemSchema).min(1),
    checklistStarterId: checklistStarterSchema.shape.id,
    clientsAccessingSite: z.array(userSchema.shape.id),
    eta: z.string().datetime()
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
export const userDepartmentAccessLevelSchema = z.enum(["admin", "elevated", "regular"])
export type userDepartmentAccessLevel = z.infer<typeof userDepartmentAccessLevelSchema>

export const userToDepartmentSchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id,
    departmentId: departmentSchema.shape.id,
    departmentAccessLevel: userDepartmentAccessLevelSchema,
    contactNumbers: z.array(z.string().min(1)).min(1),
    contactEmails: z.array(z.string().min(1).email()).min(1),
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
export const companyAccessLevelSchema = z.enum(["admin", "elevated", "regular"])
export type companyAccessLevel = z.infer<typeof companyAccessLevelSchema>

export const userToCompanySchema = z.object({
    id: z.string().min(1),
    userId: userSchema.shape.id,
    companyId: companySchema.shape.id,
    companyAccessLevel: companyAccessLevelSchema,
    onAccessList: z.boolean(),
    contactNumbers: z.array(z.string().min(1)).min(1),
    contactEmails: z.array(z.string().min(1).email()).min(1),
})
export type userToCompany = z.infer<typeof userToCompanySchema> & {
    user?: user,
    company?: company
}

export const newUserToCompanySchema = userToCompanySchema.omit({ id: true, })
export type newUserToCompany = z.infer<typeof newUserToCompanySchema>

export const updateUserToCompanySchema = userToCompanySchema.omit({ id: true, userId: true, companyId: true })
export type updateUserToCompany = z.infer<typeof updateUserToCompanySchema>