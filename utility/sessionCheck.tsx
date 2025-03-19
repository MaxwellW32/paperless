import { auth } from "@/auth/auth"
import { getSpecificUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies"
import { getSpecificUsersToDepartments } from "@/serverFunctions/handleUsersToDepartments"
import { company, companySchema, department, departmentSchema } from "@/types"

export async function sessionCheckWithError() {
    const session = await auth()

    if (session === null) {
        throw new Error("no session seen")

    } else {
        return session
    }
}

export async function ensureUserHasAccess({ departmentId, companyId }: { departmentId?: department["id"], companyId?: company["id"] }) {
    //security check - ensures only admin or elevated roles can make change

    const session = await auth()
    if (session === null) throw new Error("need session")

    //security
    if (session.user.accessLevel !== "admin") {
        //user is from Egov making a change
        if (session.user.fromDepartment) {
            const validatedDepartmentId = departmentSchema.shape.id.parse(departmentId)

            const seenUserToDepartment = await getSpecificUsersToDepartments(session.user.id, validatedDepartmentId)
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            if (seenUserToDepartment.departmentRole === "regular") throw new Error("no access to make change")

        } else {
            //user is a client making a change
            const validatedCompanyId = companySchema.shape.id.parse(companyId)

            const seenUserToCompany = await getSpecificUsersToCompanies(session.user.id, validatedCompanyId)
            if (seenUserToCompany === undefined) throw new Error("not seeing userToCompany info")

            if (seenUserToCompany.companyRole === "regular") throw new Error("no access to make change")
        }
    }
}