"use server"

import { auth } from "@/auth/auth"
import { getSpecificClientRequest } from "@/serverFunctions/handleClientRequests"
import { getSpecificDepartment } from "@/serverFunctions/handleDepartments"
import { getSpecificUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies"
import { getSpecificUsersToDepartments } from "@/serverFunctions/handleUsersToDepartments"
import { authAccessLevelResponseType, clientRequestAuthType, companyAuthType, companySchema, departmentAuthType, departmentSchema, crudOptionType } from "@/types"

//reject on no auth
//return roles 
//for each resource not edited by admins alone

export async function sessionCheckWithError() {
    const session = await auth()

    if (session === null) {
        throw new Error("no session seen")

    } else {
        return session
    }
}

export async function ensureUserIsAdmin() {
    //logged in check
    const session = await sessionCheckWithError()

    //security
    if (session.user.accessLevel !== "admin") throw new Error("not authorised to make change - need to be admin")

    return session
}

export async function ensureCanAccessDepartment(departmentAuth: departmentAuthType, crudOption: crudOptionType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: session.user.accessLevel }

    if (crudOption === "c") {
        //if not admin - can't make company
        if (session.user.accessLevel !== "admin") throw new Error("need to be admin to create department")

        return { session, accessLevel: session.user.accessLevel }

    } else if (crudOption === "r") {
        if (!session.user.fromDepartment) {
            //client
            throw new Error("client cant access department record")

        } else {
            //from department

            //validation
            departmentSchema.shape.id.parse(departmentAuth.departmentIdBeingAccessed)

            //ensure user exists in department
            const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: departmentAuth.departmentIdBeingAccessed, runSecurityCheck: false })
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
        }

    } else if (crudOption === "u") {
        if (!session.user.fromDepartment) {
            //client
            throw new Error("client cant update department")

        } else {
            //from department

            //validation
            departmentSchema.shape.id.parse(departmentAuth.departmentIdBeingAccessed)

            //ensure user exists in department
            const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: departmentAuth.departmentIdBeingAccessed, runSecurityCheck: false })
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            //ensure only department admin can update
            if (seenUserToDepartment.departmentAccessLevel !== "admin") throw new Error("not authorised to update")

            return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
        }

    } else if (crudOption === "d") {
        //if not admin - can't delete department
        if (session.user.accessLevel !== "admin") throw new Error("need to be admin to delete department")

        return { session, accessLevel: session.user.accessLevel }

    } else {
        throw new Error("invalid selection")
    }
}

export async function ensureCanAccessCompany(companyAuth: companyAuthType, crudOption: crudOptionType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: session.user.accessLevel }

    if (crudOption === "c") {
        //if not admin - can't make company
        if (session.user.accessLevel !== "admin") throw new Error("need to be admin to create company")

        return { session, accessLevel: session.user.accessLevel }

    } else if (crudOption === "r") {
        if (!session.user.fromDepartment) {
            //client

            //validation
            if (companyAuth.companyIdBeingAccessed === undefined) throw new Error("provide companyId for auth")

            //ensure client is from company
            const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: companyAuth.companyIdBeingAccessed, runAuth: false })
            if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

            return { session, accessLevel: seenUserToCompany.companyAccessLevel }

        } else {
            //from department
            if (companyAuth.departmentIdForAuth === undefined) throw new Error("provide department id for auth")

            //validation
            departmentSchema.shape.id.parse(companyAuth.departmentIdForAuth)

            //ensure user exists in department
            const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: companyAuth.departmentIdForAuth, runSecurityCheck: false })
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            const seenDepartment = await getSpecificDepartment(seenUserToDepartment.departmentId, { departmentIdBeingAccessed: "" }, false)
            if (seenDepartment === undefined) throw new Error("not seeing department")

            if (!seenDepartment.canManageRequests) throw new Error("this department can't manage requests")

            return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
        }

    } else if (crudOption === "u") {
        if (!session.user.fromDepartment) {
            //client

            //validation
            if (companyAuth.companyIdBeingAccessed === undefined) throw new Error("provide companyId for auth")

            //ensure client is from company
            const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: companyAuth.companyIdBeingAccessed, runAuth: false })
            if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

            //ensure company admin
            if (seenUserToCompany.companyAccessLevel !== "admin") throw new Error("only company admins can edit")

            return { session, accessLevel: seenUserToCompany.companyAccessLevel }

        } else {
            //from department
            throw new Error("department user can't edit company")
        }

    } else if (crudOption === "d") {
        //if not admin - can't delete company
        if (session.user.accessLevel !== "admin") throw new Error("need to be admin to delete company")

        return { session, accessLevel: session.user.accessLevel }

    } else {
        throw new Error("invalid selection")
    }
}

export async function ensureCanAccessClientRequest(clientReqAuth: clientRequestAuthType, crudOption: crudOptionType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: session.user.accessLevel }

    if (crudOption === "c") {
        if (!session.user.fromDepartment) {
            //client
            if (clientReqAuth.companyIdForAuth === undefined) throw new Error("not seeing companyIdForAuth")

            //ensure client is from company on request
            const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: clientReqAuth.companyIdForAuth, runAuth: false })
            if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

            return { session, accessLevel: seenUserToCompany.companyAccessLevel }

        } else {
            //department

            //validation
            if (clientReqAuth.departmentIdForAuth === undefined) throw new Error("not seeing departmentIdForAuth")

            departmentSchema.shape.id.parse(clientReqAuth.departmentIdForAuth)

            //ensure user exists in department
            const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: clientReqAuth.departmentIdForAuth, runSecurityCheck: false })
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            //ensure department has edit permissions
            const seenDepartment = await getSpecificDepartment(seenUserToDepartment.departmentId, { departmentIdBeingAccessed: "" }, false)
            if (seenDepartment === undefined) throw new Error("not seeing department")

            //ensure department can make changes
            if (!seenDepartment.canManageRequests) throw new Error("department doesn't have manage client request access")

            return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
        }

    } else if (crudOption === "r") {
        if (!session.user.fromDepartment) {
            //client
            if (clientReqAuth.clientRequestIdBeingAccessed === undefined) throw new Error("not seeing clientRequestIdBeingAccessed")

            //get client request
            const seenClientRequest = await getSpecificClientRequest(clientReqAuth.clientRequestIdBeingAccessed, clientReqAuth, false)
            if (seenClientRequest === undefined) throw new Error("not seeing clientRequest")

            //ensure client is from company on request
            const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: seenClientRequest.companyId, runAuth: false })
            if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

            return { session, accessLevel: seenUserToCompany.companyAccessLevel }

        } else {
            //department

            //validation
            if (clientReqAuth.departmentIdForAuth === undefined) throw new Error("not seeing departmentIdForAuth")

            departmentSchema.shape.id.parse(clientReqAuth.departmentIdForAuth)

            //ensure user exists in department
            const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: clientReqAuth.departmentIdForAuth, runSecurityCheck: false })
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
        }

    } else if (crudOption === "u") {
        if (!session.user.fromDepartment) {
            //client
            if (clientReqAuth.clientRequestIdBeingAccessed === undefined) throw new Error("not seeing clientRequestIdBeingAccessed")

            //get client request
            const seenClientRequest = await getSpecificClientRequest(clientReqAuth.clientRequestIdBeingAccessed, clientReqAuth, false)
            if (seenClientRequest === undefined) throw new Error("not seeing clientRequest")

            //ensure client is from company on request
            const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: seenClientRequest.companyId, runAuth: false })
            if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

            return { session, accessLevel: seenUserToCompany.companyAccessLevel }

        } else {
            //department
            if (clientReqAuth.clientRequestIdBeingAccessed === undefined) throw new Error("not seeing clientRequestIdBeingAccessed")

            //validation
            if (clientReqAuth.departmentIdForAuth === undefined) throw new Error("not seeing departmentIdForAuth")
            departmentSchema.shape.id.parse(clientReqAuth.departmentIdForAuth)

            //ensure user exists in department
            const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: clientReqAuth.departmentIdForAuth, runSecurityCheck: false })
            if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

            //get client request
            const seenClientRequest = await getSpecificClientRequest(clientReqAuth.clientRequestIdBeingAccessed, clientReqAuth, false)
            if (seenClientRequest === undefined) throw new Error("not seeing clientRequest")

            //get latest incomplete checklist item
            const latestChecklistItem = seenClientRequest.checklist.find(eachChecklistItem => !eachChecklistItem.completed)

            //enusre checklist is waiting for client change
            if (latestChecklistItem === undefined) throw new Error("not seeing checklist needs to be updated")

            if (latestChecklistItem.type !== "manual") throw new Error("checklist type is not manual")
            if (latestChecklistItem.for.type !== "department") throw new Error("not meant for department signoff")

            return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
        }

    } else if (crudOption === "d") {
        //if not admin - can't delete department
        if (session.user.accessLevel !== "admin") throw new Error("need to be admin to delete client request")

        return { session, accessLevel: session.user.accessLevel }

    } else {
        throw new Error("invalid selection")
    }
}
