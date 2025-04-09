import { Session } from "next-auth";
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

export const wsUpdateClientRequestsSchema = z.object({
    type: z.literal("clientRequests"),
});
export type wsUpdateClientRequestsType = z.infer<typeof wsUpdateClientRequestsSchema>

export const wsUpdateOtherSchema = z.object({
    type: z.literal("other"),
});
export type wsUpdateOtherType = z.infer<typeof wsUpdateOtherSchema>

export const wsUpdatedUnionSchema = z.union([wsUpdateClientRequestsSchema, wsUpdateOtherSchema])
export type wsUpdatedUnionType = z.infer<typeof wsUpdatedUnionSchema>

export const webSocketStandardMessageSchema = z.object({
    type: z.literal("standard"),
    data: z.object({
        updated: wsUpdatedUnionSchema
    })
});
export type webSocketStandardMessageType = z.infer<typeof webSocketStandardMessageSchema>

export const webSocketMessageJoinSchema = z.object({
    type: z.literal("join"),
});
export type webSocketMessageJoinType = z.infer<typeof webSocketMessageJoinSchema>

export const webSocketMessagePingSchema = z.object({
    type: z.literal("ping"),
});
export type webSocketMessagePingType = z.infer<typeof webSocketMessagePingSchema>

export const webSocketMessageSchema = z.union([webSocketStandardMessageSchema, webSocketMessageJoinSchema, webSocketMessagePingSchema])
export type webSocketMessageType = z.infer<typeof webSocketMessageSchema>

export type clientRequestAuthType = { clientRequestIdBeingAccessed?: clientRequest["id"], companyIdForAuth?: company["id"], departmentIdForAuth?: department["id"], closingRequest?: boolean }
export type companyAuthType = { companyIdBeingAccessed?: company["id"], departmentIdForAuth?: department["id"] }
export type departmentAuthType = { departmentIdBeingAccessed: department["id"] }
export type tapeAuthType = { companyIdBeingAccessed?: company["id"], departmentIdForAuth?: department["id"] }

export type userDepartmentCompanySelection = {
    type: "userDepartment",
    seenUserToDepartment: userToDepartment
} | {
    type: "userCompany",
    seenUserToCompany: userToCompany
}

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

export type authAccessLevelResponseType = { session: Session, accessLevel: userDepartmentAccessLevel | companyAccessLevel }

export type crudOptionType = "c" | "r" | "ra" | "u" | "d"


export type dynamicFormInputType = {
    type: "input";
    label: string;
    required: boolean,
    data: { type: "string"; value: string, placeholder: string, useTextArea: boolean }
    | { type: "number", placeholder: string, value: number, isFloat: boolean }
    | { type: "boolean"; value: boolean }
    | { type: "date"; value: string },
};
export type dynamicFormInputObjType = {
    type: "object";
    label: string;
    required: boolean,
    data: dynamicFormType;
};
export type dynamicFormInputArrType = {
    type: "array";
    label: string;
    required: boolean,
    arrayStarter: dynamicFormType,
    arrayAddLabel: string,
    data: dynamicFormType[];
};
export type dynamicFormType = { [key: string]: dynamicFormInputType | dynamicFormInputObjType | dynamicFormInputArrType; }

export const dynamicFormSchema: z.ZodType<dynamicFormType> = z.lazy(() =>
    z.record(z.string(), z.union([dynamicFormInputSchema, dynamicFormInputObjSchema, dynamicFormInputArrSchema]))
);
export const dynamicFormInputSchema = z.object({
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
export const dynamicFormInputObjSchema = z.object({
    type: z.literal("object"),
    label: z.string(),
    required: z.boolean(),
    data: dynamicFormSchema,
});
export const dynamicFormInputArrSchema = z.object({
    type: z.literal("array"),
    label: z.string(),
    required: z.boolean(),
    arrayStarter: dynamicFormSchema,
    arrayAddLabel: z.string(),
    data: z.array(dynamicFormSchema),
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

    amps: z.string().min(1).nullable(),
    weight: z.string().min(1).nullable(),
})
export type equipmet = z.infer<typeof equipmentSchema> & {
}

export const updateEquipmentSchema = equipmentSchema.omit({ id: true })
export type updateEquipment = z.infer<typeof updateEquipmentSchema>



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
}

export const newTapeSchema = tapeSchema.omit({ id: true, dateAdded: true })
export type newTape = z.infer<typeof newTapeSchema>

export const updateTapeSchema = tapeSchema.omit({ id: true, dateAdded: true })
export type updateTape = z.infer<typeof updateTapeSchema>


























export const formTypesSchema = z.enum(["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "equipmentOther", "dynamic"])
export type formTypesType = z.infer<typeof formTypesSchema>

export const tapeDepositNewTapeSchema = newTapeSchema.extend({
    id: tapeSchema.shape.id.optional(),
});
export type tapeDepositNewTapeType = z.infer<typeof tapeDepositNewTapeSchema>;

export const tapeDepositFormSchema = z.object({
    type: z.literal(formTypesSchema.Values.tapeDeposit),
    data: z.object({
        newTapes: z.array(tapeDepositNewTapeSchema).min(1, "need at least one tape to deposit"),
    }).nullable(),
});
export type tapeDepositFormType = z.infer<typeof tapeDepositFormSchema>
export type tapeDepositFormNonNullDataType = NonNullable<tapeDepositFormType["data"]>

export const tapeWithdrawFormSchema = z.object({
    type: z.literal(formTypesSchema.Values.tapeWithdraw),
    data: z.object({
    }).nullable(),
});
export type tapeWithdrawFormType = z.infer<typeof tapeWithdrawFormSchema>

export const equipmentDepositFormSchema = z.object({
    type: z.literal(formTypesSchema.Values.equipmentDeposit),
    data: z.object({
    }).nullable(),
});
export type equipmentDepositFormType = z.infer<typeof equipmentDepositFormSchema>

export const equipmentWithdrawFormSchema = z.object({
    type: z.literal(formTypesSchema.Values.equipmentWithdraw),
    data: z.object({
    }).nullable(),
});
export type equipmentWithdrawFormType = z.infer<typeof equipmentWithdrawFormSchema>

export const equipmentOtherFormSchema = z.object({
    type: z.literal(formTypesSchema.Values.equipmentOther),
    data: z.object({
    }).nullable(),
});
export type equipmentOtherFormType = z.infer<typeof equipmentOtherFormSchema>

export const checklistItemDynamicFormSchema = z.object({
    type: z.literal("dynamic"),
    data: dynamicFormSchema
})
export type checklistItemDynamicFormType = z.infer<typeof checklistItemDynamicFormSchema>

export const checklistItemFormDataSchema = z.union([tapeDepositFormSchema, tapeWithdrawFormSchema, equipmentDepositFormSchema, equipmentWithdrawFormSchema, equipmentOtherFormSchema, checklistItemDynamicFormSchema])
export type checklistItemFormDataType = z.infer<typeof checklistItemFormDataSchema>

export const checklistItemFormSchema = z.object({
    type: z.literal("form"),
    form: checklistItemFormDataSchema,
    completed: z.boolean(),
})
export type checklistItemFormType = z.infer<typeof checklistItemFormSchema>
//data is custom formSchema
//or custom tape deposit form
//or custom tape withdraw form
//or custom equipment deposit form
//or custom equipment withdraw form

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
    dateSubmitted: z.string().datetime({ offset: true }),
    status: clientRequestStatusSchema,
    checklist: z.array(checklistItemSchema).min(1),
    checklistStarterId: checklistStarterSchema.shape.id,
    clientsAccessingSite: z.array(userSchema.shape.id),
    eta: z.string().datetime({ offset: true })
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