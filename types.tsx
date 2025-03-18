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










//keep synced with db schema
export const userRoleSchema = z.enum(["admin", "elevated", "regular"])

export const userSchema = z.object({
    id: z.string().min(1),
    role: userRoleSchema.nullable(),
    name: z.string().nullable(),
    image: z.string().min(1).nullable(),
    email: z.string().min(1).nullable(),
    emailVerified: z.date().nullable(),
})
export type user = z.infer<typeof userSchema> & {
}

export const updateUserSchema = userSchema.omit({ role: true, email: true, emailVerified: true, id: true })
export type updateUser = z.infer<typeof updateUserSchema>
