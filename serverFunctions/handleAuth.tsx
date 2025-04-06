"use server"

import { auth } from "@/auth/auth"
import { getSpecificClientRequest } from "@/serverFunctions/handleClientRequests"
import { getSpecificDepartment } from "@/serverFunctions/handleDepartments"
import { getSpecificUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies"
import { getSpecificUsersToDepartments } from "@/serverFunctions/handleUsersToDepartments"
import { authAccessLevelResponseType, clientRequestAuthType, companyAuthType, companySchema, departmentAuthType, departmentSchema } from "@/types"

export async function sessionCheckWithError() {
    const session = await auth()

    if (session === null) {
        throw new Error("no session seen")

    } else {
        return session
    }
}

export async function ensureCanAccessDepartment({ departmentIdBeingAccessed, allowElevatedAccess = false }: departmentAuthType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: "admin" }

    //user is from Egov making a change
    if (!session.user.fromDepartment) throw new Error("not from department")

    //allow regular access
    if (allowElevatedAccess) return { session, accessLevel: "elevated" }

    //validation
    departmentSchema.shape.id.parse(departmentIdBeingAccessed)

    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: departmentIdBeingAccessed, runSecurityCheck: false })
    if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

    //auth role validation
    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
}

export async function ensureCanAccessCompany({ companyIdBeingAccessed, departmentIdForAuth, allowElevatedAccess = false }: companyAuthType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: "admin" }

    //allow regular access
    if (allowElevatedAccess) return { session, accessLevel: "elevated" }

    //user is from Egov making a change
    if (session.user.fromDepartment) {
        if (departmentIdForAuth === undefined) throw new Error("provide departmentId for auth")

        //does the department have edit permissions
        const seenDepartment = await getSpecificDepartment(departmentIdForAuth, { departmentIdBeingAccessed: "" }, true)
        if (seenDepartment === undefined) throw new Error("not seeing department")

        //ensure department can make changes
        if (!seenDepartment.canManageRequests) throw new Error("department doesn't have manage company access")

        //check if in department user has elevated auth
        return await ensureCanAccessDepartment({ departmentIdBeingAccessed: departmentIdForAuth })
    }

    //ensure clients pass a company id
    if (companyIdBeingAccessed === undefined) throw new Error("provide companyId for auth")

    //validation
    companySchema.shape.id.parse(companyIdBeingAccessed)

    const seenUserToCompany = await getSpecificUsersToCompanies(session.user.id, companyIdBeingAccessed, false)
    if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

    //auth role validation
    return { session, accessLevel: seenUserToCompany.companyAccessLevel }
}

export async function ensureCanAccesClientRequest(clientReqAuth: clientRequestAuthType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: "admin" }

    //allow regular access
    if (clientReqAuth.allowElevatedAccess) return { session, accessLevel: "elevated" }

    //if from department you have to be elevated and department capable of change
    if (session.user.fromDepartment) {
        if (clientReqAuth.departmentIdForAuth === undefined) throw new Error("provide departmentId for auth")

        //does the department have edit permissions
        const seenDepartment = await getSpecificDepartment(clientReqAuth.departmentIdForAuth, { departmentIdBeingAccessed: "" }, true)
        if (seenDepartment === undefined) throw new Error("not seeing department")

        //ensure department can make changes
        if (!seenDepartment.canManageRequests) throw new Error("department doesn't have manage company access")

        //check if in department user has elevated auth
        return await ensureCanAccessDepartment({ departmentIdBeingAccessed: seenDepartment.id })

    } else {
        //get client request
        const seenClientRequest = await getSpecificClientRequest(clientReqAuth.clientRequestIdBeingAccessed, clientReqAuth, true)
        if (seenClientRequest === undefined) throw new Error("not seeing clientRequest")

        //check if in company user has elevated auth
        return await ensureCanAccessCompany({ companyIdBeingAccessed: seenClientRequest.companyId })
    }
}

export async function ensureUserIsAdmin() {
    //security check - ensures only admin
    const session = await sessionCheckWithError()

    //security
    if (session.user.accessLevel !== "admin") throw new Error("not authorised to make change, need to be admin")

    return session
}