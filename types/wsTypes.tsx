import { clientRequestSchema } from "@/types";
import { z } from "zod";

export const wsUpdateClientRequestsSchema = z.object({
    type: z.literal("clientRequests"),
    update: z.union([
        z.object({
            type: z.literal("all")
        }),
        z.object({
            type: z.literal("specific"),
            id: clientRequestSchema.shape.id
        }),
    ])
});
export type wsUpdateClientRequestsType = z.infer<typeof wsUpdateClientRequestsSchema>




export const wsUpdateAdminPageSchema = z.object({
    type: z.literal("adminPage"),
    activeScreen: z.string().min(1),
    update: z.union([
        z.object({
            type: z.literal("all")
        }),
        z.object({
            type: z.literal("specific"),
            id: z.string()
        }),
    ])
});
export type wsUpdateAdminPageType = z.infer<typeof wsUpdateAdminPageSchema>




export const wsUpdatedUnionSchema = z.union([wsUpdateClientRequestsSchema, wsUpdateAdminPageSchema])
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