import z from "zod"

export const equipmentOtherRequestSchema = z.object({
    type: z.literal(requestTypeSchema.Values.equipmentOther),
});
export type equipmentOtherRequestType = z.infer<typeof equipmentOtherRequestSchema>





export const checklistSchema = z.union([tapeDepositRequestSchema, tapeWithdrawRequestSchema, equipmentDepositRequestSchema, equipmentWithdrawRequestSchema, equipmentOtherRequestSchema])
export type checklistType = z.infer<typeof checklistSchema>
