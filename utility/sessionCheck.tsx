import { auth } from "@/auth/auth"
import { getSpecificClientRequest } from "@/serverFunctions/handleClientRequests"
import { getSpecificDepartment } from "@/serverFunctions/handleDepartments"
import { getSpecificUsersToCompanies, getUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies"
import { getSpecificUsersToDepartments } from "@/serverFunctions/handleUsersToDepartments"
import { clientRequest, company, companySchema, department, departmentSchema } from "@/types"

export async function sessionCheckWithError() {
    const session = await auth()

    if (session === null) {
        throw new Error("no session seen")

    } else {
        return session
    }
}

export async function ensureCanAccessDepartment({ departmentIdBeingAccessed, allowRegularAccess = false }: { departmentIdBeingAccessed: department["id"], allowRegularAccess?: boolean }) {
    //security check - ensures only admin or elevated roles can make change
    const session = await auth()
    if (session === null) throw new Error("need session")

    //admin pass
    if (session.user.accessLevel === "admin") return session

    //user is from Egov making a change
    if (!session.user.fromDepartment) throw new Error("not from department")

    //allow regular access
    if (allowRegularAccess) return session

    //validation
    departmentSchema.shape.id.parse(departmentIdBeingAccessed)

    const seenUserToDepartment = await getSpecificUsersToDepartments(session.user.id, departmentIdBeingAccessed, { departmentIdBeingAccessed }, false)
    if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

    //auth role validation
    if (seenUserToDepartment.departmentRole === "regular") throw new Error("no access to make change")

    return session
}

export async function ensureCanAccessCompany({ companyIdBeingAccessed, departmentIdForAuth, allowRegularAccess = false }: { companyIdBeingAccessed: company["id"], departmentIdForAuth?: department["id"], allowRegularAccess?: boolean }) {
    //security check - ensures only admin or elevated roles can make change
    const session = await auth()
    if (session === null) throw new Error("need session")

    //admin pass
    if (session.user.accessLevel === "admin") return session

    //allow regular access
    if (allowRegularAccess) return session

    //user is from Egov making a change
    if (session.user.fromDepartment) {
        if (departmentIdForAuth === undefined) throw new Error("provide departmentId for auth")

        //does the department have edit permissions
        const seenDepartment = await getSpecificDepartment(departmentIdForAuth, {}, true)
        if (seenDepartment === undefined) throw new Error("not seeing department")

        //ensure department can make changes
        if (!seenDepartment.canManageRequests) throw new Error("department doesn't have manage company access")

        //check if in department user has elevated auth
        await ensureCanAccessDepartment({ departmentIdBeingAccessed: departmentIdForAuth })
    }

    //validation
    companySchema.shape.id.parse(companyIdBeingAccessed)

    const seenUserToCompany = await getSpecificUsersToCompanies(session.user.id, companyIdBeingAccessed, { companyIdBeingAccessed }, false)
    if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

    //auth role validation
    if (seenUserToCompany.companyRole === "regular") throw new Error("no access to make change")

    return session
}

export async function ensureCanAccesClientRequest({ clientRequestIdBeingAccessed, departmentIdForAuth, allowRegularAccess = false }: { clientRequestIdBeingAccessed: clientRequest["id"], departmentIdForAuth?: department["id"], allowRegularAccess?: boolean }) {
    //security check - ensures only admin or elevated roles can make change
    const session = await auth()
    if (session === null) throw new Error("need session")

    //admin pass
    if (session.user.accessLevel === "admin") return session

    //allow regular access
    if (allowRegularAccess) return session

    //if from department you have to be elevated and department capable of change
    if (session.user.fromDepartment) {
        if (departmentIdForAuth === undefined) throw new Error("provide departmentId for auth")

        //does the department have edit permissions
        const seenDepartment = await getSpecificDepartment(departmentIdForAuth, {}, true)
        if (seenDepartment === undefined) throw new Error("not seeing department")

        //ensure department can make changes
        if (!seenDepartment.canManageRequests) throw new Error("department doesn't have manage company access")

        //check if in department user has elevated auth
        await ensureCanAccessDepartment({ departmentIdBeingAccessed: departmentIdForAuth })

    } else {
        //get client request
        const seenClientRequest = await getSpecificClientRequest(clientRequestIdBeingAccessed, {})
        if (seenClientRequest === undefined) throw new Error("not seeing clientRequest")

        //is the client request company id in the users usersToCompanies table
        const seenUsersToCompanies = await getUsersToCompanies({ type: "user", userId: session.user.id }, {})

        const seenUserToCompany = seenUsersToCompanies.find(eachUserToCompany => eachUserToCompany.companyId === seenClientRequest.companyId)
        if (seenUserToCompany === undefined) throw new Error("seenUserToCompany is undefined")

        //check if in company user has elevated auth
        await ensureCanAccessCompany({ companyIdBeingAccessed: seenUserToCompany.companyId })
    }

    return session
}

export async function ensureUserIsAdmin() {
    //security check - ensures only admin
    const session = await auth()
    if (session === null) throw new Error("need session")

    //security
    if (session.user.accessLevel !== "admin") throw new Error("not authorised to make change, need to be admin")

    return session
}