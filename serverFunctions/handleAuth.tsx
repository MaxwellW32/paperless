"use server"

import { auth } from "@/auth/auth"
import { getSpecificClientRequest } from "@/serverFunctions/handleClientRequests"
import { getSpecificDepartment } from "@/serverFunctions/handleDepartments"
import { getSpecificUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies"
import { getSpecificUsersToDepartments } from "@/serverFunctions/handleUsersToDepartments"
import { authAccessLevelResponseType, clientRequestAuthType, companyAuthType, companySchema, departmentAuthType, departmentSchema, viewOptionType } from "@/types"

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

export async function ensureCanAccessDepartment({ departmentIdBeingAccessed }: departmentAuthType, viewOption: viewOptionType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //who can access a department
    //admin - view/edit...
    //company users - view no - edit no...
    //department users - view - admin users in their own department...

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: "admin" }

    //user is from Egov making a change
    if (!session.user.fromDepartment) throw new Error("not from department")

    //validation
    departmentSchema.shape.id.parse(departmentIdBeingAccessed)

    //ensure user exists in department
    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: departmentIdBeingAccessed, runSecurityCheck: false })
    if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

    if (viewOption === "edit" && seenUserToDepartment.departmentAccessLevel !== "admin") throw new Error("only department admin users can make change")

    //auth role validation
    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
}

export async function ensureCanAccessCompany({ companyIdBeingAccessed }: companyAuthType, viewOption: viewOptionType): Promise<authAccessLevelResponseType> {
    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //who can access a company
    //admin - view/edit...
    //company users - view - admins can edit
    //department users - view - no edit

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: "admin" }

    //user is from Egov making a change
    if (session.user.fromDepartment && viewOption === "edit") throw new Error("department user can't edit company")

    //ensure clients pass a company id
    if (companyIdBeingAccessed === undefined) throw new Error("provide companyId for auth")
    companySchema.shape.id.parse(companyIdBeingAccessed)

    //ensure client is from company
    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: companyIdBeingAccessed, runSecurityCheck: false })
    if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

    if (seenUserToCompany.companyAccessLevel !== "admin" && viewOption === "edit") throw new Error("only company admins can make changes")

    //auth role validation
    return { session, accessLevel: seenUserToCompany.companyAccessLevel }
}

export async function ensureUserCanAccessClientRequest(clientReqAuth: clientRequestAuthType, viewOption: viewOptionType): Promise<authAccessLevelResponseType> {
    //who can access client request
    //admin - view/edit...
    //company users - view - edit same company as request, can only edit client request...
    //department users - view - edit if department can make change

    //security check - ensures only admin or elevated roles can make change
    const session = await sessionCheckWithError()

    //admin pass
    if (session.user.accessLevel === "admin") return { session, accessLevel: "admin" }

    //get client request
    const seenClientRequest = await getSpecificClientRequest(clientReqAuth.clientRequestIdBeingAccessed, clientReqAuth, false)
    if (seenClientRequest === undefined) throw new Error("not seeing clientRequest")

    //get latest incomplete checklist item
    const latestChecklistItem = seenClientRequest.checklist.find(eachChecklistItem => !eachChecklistItem.completed)

    //check department access
    if (session.user.fromDepartment) {
        if (clientReqAuth.departmentIdForAuth === undefined) throw new Error("provide department id for auth")

        //check if user is really in department they sent
        const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: clientReqAuth.departmentIdForAuth, runSecurityCheck: false })
        if (seenUserToDepartment === undefined) throw new Error("not seeing userToDepartment info")

        if (viewOption === "edit") {
            //ensure department has edit permissions
            const seenDepartment = await getSpecificDepartment(seenUserToDepartment.departmentId, { departmentIdBeingAccessed: "" }, true)
            if (seenDepartment === undefined) throw new Error("not seeing department")

            //ensure department can make changes
            if (!seenDepartment.canManageRequests) throw new Error("department doesn't have manage client request access")

            //enusre checklist is waiting for client change
            if (latestChecklistItem === undefined) throw new Error("not seeing checklist needs to be updated")

            if (latestChecklistItem.type !== "manual") throw new Error("department user can only edit manual checklist items")

            if (latestChecklistItem.for.type !== "department") throw new Error("department user cant update this manual check")
        }

        return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }

    } else {
        //check company access

        //ensure client from same company that made request
        const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: seenClientRequest.companyId, runSecurityCheck: false })
        if (seenUserToCompany === undefined) throw new Error("not seeing seenUserToCompany info")

        if (viewOption === "edit") {
            //enusre checklist is waiting for client change
            if (latestChecklistItem === undefined) throw new Error("not seeing checklist needs to be updated")

            if (latestChecklistItem.type === "email") throw new Error("client cant update email checklist item")

            if (latestChecklistItem.type === "manual" && latestChecklistItem.for.type !== "company") throw new Error("client cant update this manual check")
        }

        return { session, accessLevel: seenUserToCompany.companyAccessLevel }
    }
}
export async function canUserAccessClientRequest(clientReqAuth: clientRequestAuthType, viewOption: viewOptionType): Promise<boolean> {
    try {
        await ensureUserCanAccessClientRequest(clientReqAuth, viewOption)
        return true

    } catch (error) {
        console.log(`$canUserAccessClientRequest err`, error);

        return false
    }
}
