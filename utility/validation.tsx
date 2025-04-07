import { user } from "@/types";

//validation checks - based on roles or other factors

export function ensureUserCanBeAddedToCompany(seenUser: user): boolean {
    if (seenUser.fromDepartment) throw new Error("user not for companies")

    return true
}

export function ensureUserCanBeAddedToDepartment(seenUser: user): boolean {
    if (!seenUser.fromDepartment) throw new Error("user not for departments")

    return true
}