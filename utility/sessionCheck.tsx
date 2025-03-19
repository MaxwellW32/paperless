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

export async function ensureUserHasAccess({ departmentIdBeingAccessed, companyIdBeingAccessed, allowRegularAccess = false }: { departmentIdBeingAccessed?: department["id"], companyIdBeingAccessed?: company["id"], allowRegularAccess?: boolean }) {
    //security check - ensures only admin or elevated roles can make change

    const session = await auth()
    if (session === null) throw new Error("need session")

    //security
    if (session.user.accessLevel !== "admin") {
        //user is from Egov making a change
        if (session.user.fromDepartment) {
            const validatedDepartmentIdBeingAccessed = departmentSchema.shape.id.parse(departmentIdBeingAccessed)

            const seenUserToDepartment = await getSpecificUsersToDepartments(session.user.id, validatedDepartmentIdBeingAccessed, { departmentIdBeingAccessed, companyIdBeingAccessed }, false)
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            if (seenUserToDepartment.departmentRole === "regular" && !allowRegularAccess) throw new Error("no access to make change")


            //user is a client making a change
        } else {
            const validatedCompanyIdBeignAccessed = companySchema.shape.id.parse(companyIdBeingAccessed)

            const seenUserToCompany = await getSpecificUsersToCompanies(session.user.id, validatedCompanyIdBeignAccessed, { departmentIdBeingAccessed, companyIdBeingAccessed }, false)
            if (seenUserToCompany === undefined) throw new Error("not seeing userToCompany info")

            if (seenUserToCompany.companyRole === "regular" && !allowRegularAccess) throw new Error("no access to make change")
        }
    }

    return session
}