"use server"
import { auth } from "@/auth/auth"
import { getSpecificClientRequest } from "@/serverFunctions/handleClientRequests"
import { getSpecificDepartment } from "@/serverFunctions/handleDepartments"
import { getSpecificUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies"
import { getSpecificUsersToDepartments } from "@/serverFunctions/handleUsersToDepartments"
import { authAccessLevelResponseType, clientRequestAuthType, companyAuthType, departmentAuthType, departmentSchema, crudOptionType, department, expectedResourceType, resourceAuthType, companySchema } from "@/types"
import { Session } from "next-auth"
import { getSpecificTapes } from "./handleTapes"
import { errorZodErrorAsString } from "@/usefulFunctions/consoleErrorWithToast"

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

export async function ensureCanAccessResource(resource: expectedResourceType, resourceAuth: resourceAuthType, crudOption: crudOptionType): Promise<string | authAccessLevelResponseType> {
    try {
        //security check - ensures only admin or elevated roles can make change
        const session = await sessionCheckWithError()

        //admin pass
        if (session.user.accessLevel === "admin") return { session, accessLevel: session.user.accessLevel }

        if (resource.type === "admin" && session.user.accessLevel !== "admin") return "need to be admin for this resource selection"

        if (resource.type === "department") {
            if (crudOption === "c") {
                //who can read create a department
                //admin 
                //company user - no
                //department user - no

                //if not admin - can't make company
                if (session.user.accessLevel !== "admin") return "need to be admin to create department"

                return { session, accessLevel: session.user.accessLevel }

            } else if (crudOption === "r") {
                //who can read a department
                //admin 
                //company user - no
                //department user - once verified in the department they're requesting

                if (!session.user.fromDepartment) {
                    //client
                    return "client cant access department record"

                } else {
                    //from department

                    //validation
                    departmentSchema.shape.id.parse(resource.departmentId)

                    //ensure user exists in department
                    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: resource.departmentId, runSecurityCheck: false })
                    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

                    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
                }

            } else if (crudOption === "ra") {
                //who can read multiple department records
                //admin
                //company user - no
                //department user - no

                if (session.user.accessLevel !== "admin") return "not authorised to access department records"

                return { session, accessLevel: session.user.accessLevel }

            } else if (crudOption === "u") {
                //who can update department
                //admin 
                //company user - no
                //department user - admin only 

                if (!session.user.fromDepartment) {
                    //client
                    return "client cant update department"

                } else {
                    //from department

                    //validation
                    departmentSchema.shape.id.parse(resource.departmentId)

                    //ensure user exists in department
                    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: resource.departmentId, runSecurityCheck: false })
                    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

                    //ensure only department admin can update
                    if (seenUserToDepartment.departmentAccessLevel !== "admin") return "not authorised to update"

                    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
                }

            } else if (crudOption === "d") {
                //who can delete department
                //admin 
                //company user - no
                //department user - no 

                //if not admin - can't delete department
                if (session.user.accessLevel !== "admin") return "need to be admin to delete department"

                return { session, accessLevel: session.user.accessLevel }

            } else {
                return "invalid crud selection"
            }

        } else if (resource.type === "company") {
            if (crudOption === "c") {
                //who can create company
                //admin 
                //company user - no
                //department user - no

                //if not admin - can't make company
                if (session.user.accessLevel !== "admin") return "need to be admin to create company"

                return { session, accessLevel: session.user.accessLevel }

            } else if (crudOption === "r") {
                //who can read company record
                //admin 
                //company user - has to be from same company they're requesting
                //department user - yes

                if (!session.user.fromDepartment) {
                    //client

                    //validation
                    if (resourceAuth.compantyIdForAuth === undefined) return "provide companyId for auth"
                    companySchema.shape.id.parse(resourceAuth.compantyIdForAuth)

                    //ensure client is from company
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: resourceAuth.compantyIdForAuth, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    return { session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //from department
                    if (resourceAuth.departmentIdForAuth === undefined) return "provide department id for auth"

                    //validation
                    departmentSchema.shape.id.parse(resourceAuth.departmentIdForAuth)

                    //ensure user exists in department
                    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: resourceAuth.departmentIdForAuth, runSecurityCheck: false })
                    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

                    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
                }

            } else if (crudOption === "ra") {
                //who can read multiple company records
                //admin 
                //company user - no
                //department user - yes, if can manage requests

                //ensure no clients
                if (!session.user.fromDepartment) return "client not authorised to view department records"

                //validation
                if (resourceAuth.departmentIdForAuth === undefined) return "not seeing departmentIdForAuth"

                return checkIfDepartmentHasManageAccess(session, resourceAuth.departmentIdForAuth)

            } else if (crudOption === "u") {
                //who can update company
                //admin 
                //company user - yes - admin user only
                //department user - no

                if (!session.user.fromDepartment) {
                    //client

                    //validation
                    if (resourceAuth.compantyIdForAuth === undefined) return "provide companyId for auth"
                    companySchema.shape.id.parse(resourceAuth.compantyIdForAuth)

                    //ensure client is from company
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: resourceAuth.compantyIdForAuth, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    //ensure company admin
                    if (seenUserToCompany.companyAccessLevel !== "admin") return "only company admins can edit"

                    return { session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //from department
                    return "department user can't edit company"
                }

            } else if (crudOption === "d") {
                //who can delete company
                //admin 
                //company user - no
                //department user - no

                //if not admin - can't delete company
                if (session.user.accessLevel !== "admin") return "need to be admin to delete company"

                return { session, accessLevel: session.user.accessLevel }

            } else {
                return "invalid selection"
            }

        } else if (resource.type === "clientRequests") {
            if (crudOption === "c") {
                //who can create client request
                //admin 
                //company user - yes - validated client from a company
                //department user - yes - if can manage requests

                if (!session.user.fromDepartment) {
                    //client
                    if (resourceAuth.compantyIdForAuth === undefined) return "not seeing companyIdForAuth"
                    companySchema.shape.id.parse(resourceAuth.compantyIdForAuth)

                    //ensure client is from a company
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: resourceAuth.compantyIdForAuth, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    return { session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //department

                    //validation
                    if (resourceAuth.departmentIdForAuth === undefined) return "not seeing departmentIdForAuth"

                    return checkIfDepartmentHasManageAccess(session, resourceAuth.departmentIdForAuth)
                }

            } else if (crudOption === "r") {
                //who can read client request
                //admin 
                //company user - yes - if from same company as request
                //department user - yes

                if (!session.user.fromDepartment) {
                    //client

                    //get client request
                    const seenClientRequest = await getSpecificClientRequest(resource.clientRequestId, {}, false)
                    if (seenClientRequest === undefined) return "not seeing clientRequest"

                    //ensure client is from same company on request
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: seenClientRequest.companyId, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    return { session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //department

                    //validation
                    if (resourceAuth.departmentIdForAuth === undefined) return "not seeing departmentIdForAuth"

                    departmentSchema.shape.id.parse(resourceAuth.departmentIdForAuth)

                    //ensure user exists in department
                    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: resourceAuth.departmentIdForAuth, runSecurityCheck: false })
                    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

                    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
                }

            } else if (crudOption === "ra") {
                //who can read multipleclient request
                //admin 
                //company user - yes - if from same company as request
                //department user - yes

                if (!session.user.fromDepartment) {
                    //client

                    if (resourceAuth.compantyIdForAuth === undefined) return "provide companyId for auth"
                    companySchema.shape.id.parse(resourceAuth.compantyIdForAuth)

                    //ensure client is from same company on request
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: resourceAuth.compantyIdForAuth, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    return { session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //department

                    //validation
                    if (resourceAuth.departmentIdForAuth === undefined) return "not seeing departmentIdForAuth"
                    departmentSchema.shape.id.parse(resourceAuth.departmentIdForAuth)

                    //ensure user exists in department
                    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: resourceAuth.departmentIdForAuth, runSecurityCheck: false })
                    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

                    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
                }

            } else if (crudOption === "u") {
                //who can update client request
                //admin 
                //company user - if from same company as request
                //department user - yes - if client request has a checklist item waiting on the department

                if (!session.user.fromDepartment) {
                    //client

                    //get client request
                    const seenClientRequest = await getSpecificClientRequest(resource.clientRequestId, {}, false)
                    if (seenClientRequest === undefined) return "not seeing clientRequest"

                    //ensure client is from same company on request
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: seenClientRequest.companyId, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    return { session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //department

                    //validation
                    if (resourceAuth.departmentIdForAuth === undefined) return "not seeing departmentIdForAuth"
                    departmentSchema.shape.id.parse(resourceAuth.departmentIdForAuth)

                    //ensure user exists in department
                    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: resourceAuth.departmentIdForAuth, runSecurityCheck: false })
                    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

                    //get client request
                    const seenClientRequest = await getSpecificClientRequest(resource.clientRequestId, {}, false)
                    if (seenClientRequest === undefined) return "not seeing clientRequest"

                    //get latest incomplete checklist item
                    const latestChecklistItem = seenClientRequest.checklist.find(eachChecklistItem => !eachChecklistItem.completed)

                    //enusre checklist is waiting for client change
                    if (latestChecklistItem === undefined) {
                        //ensure department has edit permissions
                        const seenDepartment = await getSpecificDepartment(seenUserToDepartment.departmentId, {}, false)
                        if (seenDepartment === undefined) return "not seeing department"

                        //ensure department can make changes
                        if (!seenDepartment.canManageRequests) return "department doesn't have manage client request access"

                    } else {
                        //if there are checklist items remaining - check if they can be updated by department

                        if (latestChecklistItem.type !== "manual") return "checklist type is not manual"
                        if (latestChecklistItem.for.type !== "department") return "not meant for department signoff"
                    }

                    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
                }

            } else if (crudOption === "d") {
                //who can delete client request
                //admin 
                //company user - no
                //department user - no

                if (session.user.accessLevel !== "admin") return "need to be admin to delete client request"

                return { session, accessLevel: session.user.accessLevel }

            } else {
                return "invalid selection"
            }

        } else if (resource.type === "tape") {
            //ensures client is from same company that holds the tape - and department has manage access
            async function ensureClientFromCompanyAndDepartmentHasAccess(localSession: Session, localResource: expectedResourceType, localResourceAuth: resourceAuthType,): Promise<string | authAccessLevelResponseType> {
                if (localSession.user.accessLevel === "admin") {
                    return { session: localSession, accessLevel: localSession.user.accessLevel }
                }

                if (localResource.type === "tape") {
                    if (!localSession.user.fromDepartment) {
                        //client

                        //get tape
                        const seenTape = await getSpecificTapes(localResource.tapeId, {}, false)
                        if (seenTape === undefined) return "not seeing tape"

                        //then get company on tape to compare

                        //ensure client is from same company as tape
                        const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: localSession.user.id, companyId: seenTape.companyId, runAuth: false })
                        if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                        return { session: localSession, accessLevel: seenUserToCompany.companyAccessLevel }

                    } else {
                        //from department
                        if (localResourceAuth.departmentIdForAuth === undefined) return "provide department id for auth"

                        return checkIfDepartmentHasManageAccess(localSession, localResourceAuth.departmentIdForAuth)
                    }

                } else {
                    return "for tapes check only"
                }
            }

            if (crudOption === "c") {
                //who can create tape
                //admin 
                //company user - yes if from company
                //department user - yes if manage access

                if (!session.user.fromDepartment) {
                    //client

                    //validation
                    if (resourceAuth.compantyIdForAuth === undefined) return "provide companyId for auth"
                    companySchema.shape.id.parse(resourceAuth.compantyIdForAuth)

                    //ensure client is from company
                    const seenUserToCompany = await getSpecificUsersToCompanies({ type: "both", userId: session.user.id, companyId: resourceAuth.compantyIdForAuth, runAuth: false })
                    if (seenUserToCompany === undefined) return "not seeing seenUserToCompany info"

                    return { session: session, accessLevel: seenUserToCompany.companyAccessLevel }

                } else {
                    //from department
                    if (resourceAuth.departmentIdForAuth === undefined) return "provide department id for auth"

                    return checkIfDepartmentHasManageAccess(session, resourceAuth.departmentIdForAuth)
                }

            } else if (crudOption === "r") {
                //who can read tape record
                //admin 
                //company user - has to be from same company that owns tape
                //department user - yes if has manage access rights

                return ensureClientFromCompanyAndDepartmentHasAccess(session, resource, resourceAuth)

            } else if (crudOption === "ra") {//same as above
                //who can read multiple tape record
                //admin 
                //company user - yes if from same company
                //department user - yes, if can manage requests

                return ensureClientFromCompanyAndDepartmentHasAccess(session, resource, resourceAuth)

            } else if (crudOption === "u") {
                //who can update tape
                //admin 
                //company user - yes if from same company
                //department user - yes if can manage requests

                return ensureClientFromCompanyAndDepartmentHasAccess(session, resource, resourceAuth)

            } else if (crudOption === "d") {
                //who can delete tape
                //admin 
                //company user - no
                //department user - no

                //if not admin - can't delete company
                if (session.user.accessLevel !== "admin") return "need to be admin to delete company"

                return { session, accessLevel: session.user.accessLevel }

            } else {
                return "invalid selection"
            }

        } else {
            return "invalid crud selection"
        }

    } catch (error) {
        return errorZodErrorAsString(error)
    }
}

export async function checkIfDepartmentHasManageAccess(session: Session, departmentAuthId: department["id"]): Promise<string | authAccessLevelResponseType> {
    departmentSchema.shape.id.parse(departmentAuthId)

    //ensure user exists in department
    const seenUserToDepartment = await getSpecificUsersToDepartments({ type: "both", userId: session.user.id, departmentId: departmentAuthId, runSecurityCheck: false })
    if (seenUserToDepartment === undefined) return "not seeing userToDepartment info"

    //ensure department has edit permissions
    const seenDepartment = await getSpecificDepartment(seenUserToDepartment.departmentId, {}, false)
    if (seenDepartment === undefined) return "not seeing department"

    //ensure department can make changes
    if (!seenDepartment.canManageRequests) return "department doesn't have manage client request access"

    return { session, accessLevel: seenUserToDepartment.departmentAccessLevel }
}
