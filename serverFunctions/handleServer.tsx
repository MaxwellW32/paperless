import { revalidatePath } from "next/cache";

export async function refreshAdminPath() {
    revalidatePath(`/admin`)
}
