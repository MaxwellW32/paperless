"use client"
import React, { useEffect, useMemo, useState } from 'react'
import styles from "./style.module.css"
import { deepClone, updateRefreshObj } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistStarter, clientRequest, company, department, userDepartmentCompanySelection, newClientRequest, newClientRequestSchema, refreshObjType, updateClientRequestSchema, companyAuthType, clientRequestAuthType, userToCompany } from '@/types'
import { addClientRequests, runChecklistAutomation, updateClientRequests } from '@/serverFunctions/handleClientRequests'
import { ReadRecursiveChecklistForm } from '../recursiveChecklistForm/RecursiveChecklistForm'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal, refreshWSObjGlobal } from '@/utility/globalState'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import { useSession } from 'next-auth/react'
import { getUsersToCompaniesWithVisitAccess } from '@/serverFunctions/handleUsersToCompanies'

export default function AddEditClientRequest({ checklistStarter, sentClientRequest, department }: { checklistStarter?: checklistStarter, sentClientRequest?: clientRequest, department?: department }) {
    const { data: session } = useSession()

    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshObjType>(refreshWSObjGlobal)

    const initialFormObj: newClientRequest = {
        companyId: "",
        checklist: checklistStarter !== undefined ? checklistStarter.checklist : [],
        checklistStarterId: checklistStarter !== undefined ? checklistStarter.id : "",
        clientsAccessingSite: []
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<clientRequest>>(deepClone(sentClientRequest !== undefined ? updateClientRequestSchema.parse(sentClientRequest) : initialFormObj))

    // type clientRequestKeys = keyof Partial<clientRequest>
    // const [, formErrorsSet] = useState<Partial<{ [key in clientRequestKeys]: string }>>({})

    const [activeChecklistFormIndex, activeChecklistFormIndexSet] = useState<number | undefined>()

    const [activeCompanyId, activeCompanyIdSet] = useState<company["id"] | undefined>()
    const [companies, companiesSet] = useState<company[]>([])

    const [usersToCompaniesWithAccess, usersToCompaniesWithAccessSet] = useState<userToCompany[] | undefined>(undefined)

    const editableChecklistFormIndexes = useMemo<number[]>(() => {
        if (formObj.checklist === undefined) return []

        const newNumArray: number[] = []

        formObj.checklist.map((eachChecklist, eachChecklistIndex) => {
            if (eachChecklist.type !== "form") return
            if (formObj.checklist === undefined) return

            const previousIsComplete = eachChecklistIndex !== 0 ? formObj.checklist[eachChecklistIndex - 1].completed : true

            //if checklist item is a form and previous items are complete, make available to the client to edit
            if (previousIsComplete) {
                newNumArray.push(eachChecklistIndex)
            }
        })

        if (newNumArray.length === 1) {
            activeChecklistFormIndexSet(newNumArray[0])
        }

        return newNumArray

    }, [formObj.checklist])

    const companyAuth = useMemo<companyAuthType | undefined>(() => {
        if (session === null) return undefined

        //if admin
        if (session.user.accessLevel === "admin") {
            return {}

            //if from department
        } else if (department !== undefined && department.canManageRequests) {
            return { departmentIdForAuth: department.id }

            //if from client
        } else if (userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany") {
            return { companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId }

        } else {
            return undefined
        }

    }, [session, userDepartmentCompanySelection, department])

    //handle changes from above
    useEffect(() => {
        if (sentClientRequest === undefined) return

        formObjSet(deepClone(updateClientRequestSchema.parse(sentClientRequest)))

        //set company id
        activeCompanyIdSet(sentClientRequest.companyId)

    }, [sentClientRequest])

    //if only one company for client set as active
    useEffect(() => {
        try {
            const search = async () => {
                if (userDepartmentCompanySelection === null) return

                //only run for clients accounts
                if (userDepartmentCompanySelection.type !== "userCompany") return

                //set the active company id
                activeCompanyIdSet(userDepartmentCompanySelection.seenUserToCompany.companyId)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [userDepartmentCompanySelection])

    //everytime active company id changes get users in company that can access the site
    useEffect(() => {
        try {
            const search = async () => {
                if (activeCompanyId === undefined || companyAuth === undefined) return

                //search for users in this company with access to site
                handleSearchUsersToCompaniesWithAccess(activeCompanyId, companyAuth)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [activeCompanyId, companyAuth])

    // function checkIfValid(seenFormObj: Partial<clientRequest>, seenName: keyof Partial<clientRequest>, schema: typeof clientRequestSchema) {
    //     // @ts-expect-error type
    //     const testSchema = schema.pick({ [seenName]: true }).safeParse(seenFormObj);

    //     if (testSchema.success) {//worked
    //         formErrorsSet(prevObj => {
    //             const newObj = { ...prevObj }
    //             delete newObj[seenName]

    //             return newObj
    //         })

    //     } else {
    //         formErrorsSet(prevObj => {
    //             const newObj = { ...prevObj }

    //             let errorMessage = ""

    //             JSON.parse(testSchema.error.message).forEach((eachErrorObj: Error) => {
    //                 errorMessage += ` ${eachErrorObj.message}`
    //             })

    //             newObj[seenName] = errorMessage

    //             return newObj
    //         })
    //     }
    // }

    async function handleSubmit() {
        try {
            //send off new client request
            if (activeCompanyId === undefined) throw new Error("not seeing company id")

            toast.success("submittting")

            if (sentClientRequest === undefined) {
                //make new client request

                //add on company id
                formObj.companyId = activeCompanyId

                //validate
                const validatedNewClientRequest: newClientRequest = newClientRequestSchema.parse(formObj)

                //validate the forms, then mark as complete

                //mark as complete
                validatedNewClientRequest.checklist = validatedNewClientRequest.checklist.map((eachChecklist, eachChecklistIndex) => {
                    if (eachChecklist.type === "form") {
                        //ensure checklist form present
                        if (activeChecklistFormIndex === undefined) throw new Error("checklist form not selected")

                        if (editableChecklistFormIndexes.includes(eachChecklistIndex)) {
                            eachChecklist.completed = true
                        }
                    }

                    return eachChecklist
                })

                //send up to server
                const newAddedClientRequest = await addClientRequests(validatedNewClientRequest)

                //run automation
                await runChecklistAutomation(newAddedClientRequest.id, newAddedClientRequest.checklist, department !== undefined && department.canManageRequests ? { departmentIdForAuth: department.id, clientRequestIdBeingAccessed: "" } : { clientRequestIdBeingAccessed: newAddedClientRequest.id })

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedClientRequest = updateClientRequestSchema.parse(formObj)

                //mark as complete
                validatedUpdatedClientRequest.checklist = validatedUpdatedClientRequest.checklist.map((eachChecklist, eachChecklistIndex) => {
                    if (eachChecklist.type === "form") {
                        //ensure checklist form present
                        if (activeChecklistFormIndex === undefined) throw new Error("checklist form not selected")

                        if (editableChecklistFormIndexes.includes(eachChecklistIndex)) {
                            eachChecklist.completed = true
                        }
                    }

                    return eachChecklist
                })

                let seenclientRequestAuth: clientRequestAuthType | undefined = undefined

                if (session !== null && session.user.accessLevel === "admin") {
                    seenclientRequestAuth = { clientRequestIdBeingAccessed: sentClientRequest.id }

                } else if (department !== undefined && department.canManageRequests) {
                    seenclientRequestAuth = { departmentIdForAuth: department.id, clientRequestIdBeingAccessed: "" }
                }

                if (seenclientRequestAuth === undefined) throw new Error("not seeing client request auth")

                //update
                const updatedClientRequest = await updateClientRequests(sentClientRequest.id, validatedUpdatedClientRequest, seenclientRequestAuth)

                //run automation
                await runChecklistAutomation(updatedClientRequest.id, updatedClientRequest.checklist, seenclientRequestAuth)

                toast.success("request updated")
            }

            //change on server happened

            //update locally
            refreshObjSet(prevRefreshObj => {
                return updateRefreshObj(prevRefreshObj, "clientRequests")
            })

            //send ws update
            refreshWSObjSet(prevWSRefreshObj => {
                return updateRefreshObj(prevWSRefreshObj, "clientRequests")
            })

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    async function handleSearchUsersToCompaniesWithAccess(companyId: company["id"], companyAuth: companyAuthType) {
        //get users in company that can access the site on load - only if new request
        const seenUsersToCompaniesWithAccess = await getUsersToCompaniesWithVisitAccess(companyId, companyAuth)
        usersToCompaniesWithAccessSet(seenUsersToCompaniesWithAccess)
    }

    return (
        <form className={styles.form} action={() => { }}>
            {((session !== null && session.user.accessLevel === "admin") || (department !== undefined && department.canManageRequests)) && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                        <button className='button1'
                            onClick={async () => {
                                try {
                                    if (companyAuth === undefined) return
                                    toast.success("searching")

                                    companiesSet(await getCompanies(companyAuth))

                                } catch (error) {
                                    consoleAndToastError(error)
                                }
                            }}
                        >get companies</button>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "250px", overflow: "auto" }} className='snap'>
                            {companies.map(eachCompany => {
                                return (
                                    <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
                                        <h3>{eachCompany.name}</h3>

                                        <button className='button3'
                                            onClick={() => {
                                                toast.success(`selected`)

                                                activeCompanyIdSet(eachCompany.id)
                                            }}
                                        >select</button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {(userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany") && (
                <>
                    <button className='button3'
                        onClick={async () => {
                            try {
                                //client only refresh button
                                if (companyAuth === undefined) return

                                //search 
                                handleSearchUsersToCompaniesWithAccess(userDepartmentCompanySelection.seenUserToCompany.companyId, companyAuth)

                            } catch (error) {
                                consoleAndToastError(error)
                            }
                        }}
                    >refresh clients</button>
                </>
            )}

            {usersToCompaniesWithAccess !== undefined && (
                <>
                    {usersToCompaniesWithAccess.length > 0 ? (
                        <>
                            <label>Clients visiting:</label>

                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "250px", overflow: "auto" }} className='snap'>
                                {usersToCompaniesWithAccess.map(eachUserToCompany => {
                                    if (eachUserToCompany.user === undefined) return null

                                    const seenInFormObj = formObj.clientsAccessingSite !== undefined && formObj.clientsAccessingSite.includes(eachUserToCompany.userId)

                                    return (
                                        <div key={eachUserToCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: seenInFormObj ? "rgb(var(--color3))" : "rgb(var(--color2))", padding: "1rem" }}>
                                            <h3>{eachUserToCompany.user.name}</h3>

                                            <button className='button3'
                                                onClick={() => {
                                                    toast.success(`selected`)

                                                    //set the client accessing site
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.clientsAccessingSite === undefined) return prevFormObj

                                                        //add user to list
                                                        if (!newFormObj.clientsAccessingSite.includes(eachUserToCompany.userId)) {
                                                            newFormObj.clientsAccessingSite = [...newFormObj.clientsAccessingSite, eachUserToCompany.userId]
                                                        }

                                                        return newFormObj
                                                    })
                                                }}
                                            >add</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div>
                            <p>No users seen to facilitate visit</p>
                            <p>Please ask our team to add visiting access for some users</p>
                        </div>
                    )}
                </>
            )}

            {editableChecklistFormIndexes.length > 1 && (
                <>
                    <label>choose active form</label>

                    <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "50px" }}>
                        {editableChecklistFormIndexes.map(eachEditableFormIndex => {
                            return (
                                <button className='button2' key={eachEditableFormIndex}
                                    onClick={() => {
                                        activeChecklistFormIndexSet(eachEditableFormIndex)
                                    }}
                                ></button>
                            )
                        })}
                    </div>
                </>
            )}

            {activeChecklistFormIndex !== undefined && formObj.checklist !== undefined && formObj.checklist[activeChecklistFormIndex].type === "form" && (
                <ReadRecursiveChecklistForm seenForm={formObj.checklist[activeChecklistFormIndex].data}
                    handleFormUpdate={(seenLatestForm) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.checklist === undefined) return prevFormObj

                            //edit new checklist item
                            const newChecklistItem = { ...newFormObj.checklist[activeChecklistFormIndex] }
                            if (newChecklistItem.type !== "form") return prevFormObj

                            newChecklistItem.data = seenLatestForm

                            newFormObj.checklist[activeChecklistFormIndex] = newChecklistItem

                            return newFormObj
                        })
                    }}
                />
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentClientRequest !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































