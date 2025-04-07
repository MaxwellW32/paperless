"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone, updateRefreshObj } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistStarter, clientRequest, company, department, userDepartmentCompanySelection, newClientRequest, newClientRequestSchema, refreshObjType, updateClientRequestSchema, userToCompany, checklistItemType, clientRequestAuthType } from '@/types'
import { addClientRequests, updateClientRequests } from '@/serverFunctions/handleClientRequests'
import { ReadRecursiveChecklistForm } from '../recursiveChecklistForm/RecursiveChecklistForm'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal, refreshWSObjGlobal } from '@/utility/globalState'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import { useSession } from 'next-auth/react'
import { getUsersToCompaniesWithVisitAccess } from '@/serverFunctions/handleUsersToCompanies'
import ShowMore from '../showMore/ShowMore'

export default function AddEditClientRequest({ checklistStarter, sentClientRequest, department }: { checklistStarter?: checklistStarter, sentClientRequest?: clientRequest, department?: department }) {
    const { data: session } = useSession()

    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshObjType>(refreshWSObjGlobal)

    const initialFormObj: newClientRequest | undefined = checklistStarter !== undefined ? {
        companyId: "",
        checklist: checklistStarter.checklist,
        checklistStarterId: checklistStarter.id,
        clientsAccessingSite: []
    } : undefined

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<clientRequest>>(deepClone(sentClientRequest === undefined && initialFormObj !== undefined ? initialFormObj : updateClientRequestSchema.parse(sentClientRequest)))

    // type clientRequestKeys = keyof Partial<clientRequest>
    // const [formErrors, formErrorsSet] = useState<Partial<{ [key in clientRequestKeys]: string }>>({})

    // const [activeChecklistFormIndex, activeChecklistFormIndexSet] = useState<number | undefined>()

    const [activeCompanyId, activeCompanyIdSet] = useState<company["id"] | undefined>()
    const [companies, companiesSet] = useState<company[]>([])

    const [usersToCompaniesWithAccess, usersToCompaniesWithAccessSet] = useState<userToCompany[] | undefined>(undefined)

    // const editableChecklistFormIndexes = useMemo<number[]>(() => {
    //     if (formObj.checklist === undefined) return []

    //     const newNumArray: number[] = []

    //     formObj.checklist.map((eachChecklist, eachChecklistIndex) => {
    //         if (eachChecklist.type !== "form") return
    //         if (formObj.checklist === undefined) return

    //         const previousIsComplete = eachChecklistIndex !== 0 ? formObj.checklist[eachChecklistIndex - 1].completed : true

    //         //if checklist item is a form and previous items are complete, make available to the client to edit
    //         if (previousIsComplete) {
    //             newNumArray.push(eachChecklistIndex)
    //         }
    //     })

    //     if (newNumArray.length === 1) {
    //         activeChecklistFormIndexSet(newNumArray[0])
    //     }

    //     return newNumArray

    // }, [formObj.checklist])

    // const companyAuth = useMemo<companyAuthType | undefined>(() => {
    //     if (session === null) return undefined

    //     //if admin
    //     if (session.user.accessLevel === "admin") {
    //         return {}

    //         //if from department
    //     } else if (department !== undefined && department.canManageRequests) {
    //         return { departmentIdForAuth: department.id }

    //         //if from client
    //     } else if (userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany") {
    //         return { companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId }

    //     } else {
    //         return undefined
    //     }

    // }, [session, userDepartmentCompanySelection, department])

    //handle changes from above

    useEffect(() => {
        if (sentClientRequest === undefined) return

        formObjSet(deepClone(updateClientRequestSchema.parse(sentClientRequest)))

        //set company id
        activeCompanyIdSet(sentClientRequest.companyId)

    }, [sentClientRequest])

    //for clients only set active companyId
    useEffect(() => {
        const search = async () => {
            if (userDepartmentCompanySelection === null) return

            //only run for clients accounts
            if (userDepartmentCompanySelection.type !== "userCompany") return

            //set the active company id
            activeCompanyIdSet(userDepartmentCompanySelection.seenUserToCompany.companyId)
        }
        search()

    }, [userDepartmentCompanySelection])

    //everytime active company id changes get users in company that can access the site
    useEffect(() => {
        try {
            const search = async () => {
                if (activeCompanyId === undefined) return

                //search for users in this company with access to site
                handleSearchUsersToCompaniesWithAccess(activeCompanyId)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [activeCompanyId])

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
    function markLatestFormAsComplete(checklist: checklistItemType[]) {
        const latestChecklistItemIndex = checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
        if (latestChecklistItemIndex === -1) return checklist

        const latestChecklistItem = checklist[latestChecklistItemIndex]

        //complete the forms sent
        if (latestChecklistItem.type === "form") {
            latestChecklistItem.completed = true
        }

        //update in checklist
        checklist = checklist.map((eachChecklist, eachChecklistIndex) => {
            if (eachChecklistIndex === latestChecklistItemIndex) {
                return latestChecklistItem
            }

            return eachChecklist
        })

        return checklist
    }

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

                //mark as complete
                validatedNewClientRequest.checklist = markLatestFormAsComplete(validatedNewClientRequest.checklist)

                //send up to server
                await addClientRequests(validatedNewClientRequest, { companyIdForAuth: activeCompanyId, departmentIdForAuth: department !== undefined ? department.id : undefined })

                toast.success("submitted")

                //reset
                if (initialFormObj !== undefined) {
                    formObjSet(deepClone(initialFormObj))

                    activeCompanyIdSet(undefined)
                }

            } else {
                //validate
                const validatedUpdatedClientRequest = updateClientRequestSchema.parse(formObj)

                //mark as complete
                validatedUpdatedClientRequest.checklist = markLatestFormAsComplete(validatedUpdatedClientRequest.checklist)

                const clientRequestAuth: clientRequestAuthType = { clientRequestIdBeingAccessed: sentClientRequest.id, departmentIdForAuth: department !== undefined ? department.id : undefined }

                //update
                await updateClientRequests(sentClientRequest.id, validatedUpdatedClientRequest, clientRequestAuth)

                toast.success("request updated")
            }

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

    async function handleSearchUsersToCompaniesWithAccess(companyId: company["id"]) {
        //get users in company that can access the site 
        usersToCompaniesWithAccessSet(await getUsersToCompaniesWithVisitAccess(companyId))
    }

    return (
        <form className={styles.form} action={() => { }}>
            {((session !== null && session.user.accessLevel === "admin") || (department !== undefined && department.canManageRequests)) && (
                <>
                    <label>company for request</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                        <button className='button1'
                            onClick={async () => {
                                try {
                                    toast.success("searching")

                                    companiesSet(await getCompanies(true))

                                } catch (error) {
                                    consoleAndToastError(error)
                                }
                            }}
                        >get companies</button>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "250px", overflow: "auto" }} className='snap'>
                            {companies.map(eachCompany => {
                                return (
                                    <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: eachCompany.id === activeCompanyId ? "rgb(var(--color3))" : "rgb(var(--color2))", padding: "1rem" }}>
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
                                //search 
                                handleSearchUsersToCompaniesWithAccess(userDepartmentCompanySelection.seenUserToCompany.companyId)

                            } catch (error) {
                                consoleAndToastError(error)
                            }
                        }}
                    >refresh clients</button>
                </>
            )}

            {formObj.clientsAccessingSite !== undefined && usersToCompaniesWithAccess !== undefined && (
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

            {formObj.checklist !== undefined && (
                <>
                    {session !== null && session.user.accessLevel === "admin" && (
                        <label>checklist</label>
                    )}

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                        {formObj.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                            let canShowFormObj = false
                            if (session === null) return null

                            if (session.user.accessLevel === "admin") {
                                canShowFormObj = true

                            } else if (eachChecklistItem.type === "form") {
                                canShowFormObj = true
                            }

                            if (!canShowFormObj) return null

                            return (
                                <div key={eachChecklistItemIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>

                                    {eachChecklistItem.type === "form" && (
                                        <>
                                            <ReadRecursiveChecklistForm seenForm={eachChecklistItem.data}
                                                handleFormUpdate={(seenLatestForm) => {
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.checklist === undefined) return prevFormObj

                                                        //edit new checklist item
                                                        const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                        if (newChecklistItem.type !== "form") return prevFormObj

                                                        newChecklistItem.data = seenLatestForm

                                                        newFormObj.checklist[eachChecklistItemIndex] = newChecklistItem

                                                        return newFormObj
                                                    })
                                                }}
                                            />
                                        </>
                                    )}

                                    {session.user.accessLevel === "admin" && (
                                        <label>{eachChecklistItem.type}</label>
                                    )}

                                    {eachChecklistItem.type === "email" && (
                                        <>
                                            <label>to: </label>
                                            <p>{eachChecklistItem.to}</p>

                                            <label>subject: </label>
                                            <p>{eachChecklistItem.subject}</p>

                                            <label>email: </label>
                                            <p>{eachChecklistItem.email}</p>
                                        </>
                                    )}

                                    {eachChecklistItem.type === "manual" && (
                                        <>
                                            <label>for: </label>
                                            <p>{eachChecklistItem.for.type}</p>

                                            <label>prompt: </label>
                                            <p>{eachChecklistItem.prompt}</p>
                                        </>
                                    )}


                                    {session.user.accessLevel === "admin" && (
                                        <>
                                            <button className='button1' style={{ backgroundColor: eachChecklistItem.completed ? "rgb(var(--color1))" : "" }}
                                                onClick={() => {
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.checklist === undefined) return prevFormObj

                                                        //to ensure refresh of boolean
                                                        newFormObj.checklist = [...newFormObj.checklist]
                                                        newFormObj.checklist[eachChecklistItemIndex] = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                        newFormObj.checklist[eachChecklistItemIndex].completed = !newFormObj.checklist[eachChecklistItemIndex].completed

                                                        return newFormObj
                                                    })
                                                }}
                                            >{eachChecklistItem.completed ? "completed" : "incomplete"}</button>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentClientRequest !== undefined ? "update" : "submit"}</button>
        </form>
    )
}





// {editableChecklistFormIndexes.length > 1 && (
//     <>
//         <label>choose active form</label>

//         <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "50px" }}>
//             {editableChecklistFormIndexes.map(eachEditableFormIndex => {
//                 return (
//                     <button className='button2' key={eachEditableFormIndex}
//                         onClick={() => {
//                             activeChecklistFormIndexSet(eachEditableFormIndex)
//                         }}
//                     ></button>
//                 )
//             })}
//         </div>
//     </>
// )}

// {activeChecklistFormIndex !== undefined && formObj.checklist !== undefined && formObj.checklist[activeChecklistFormIndex].type === "form" && (
//     <ReadRecursiveChecklistForm seenForm={formObj.checklist[activeChecklistFormIndex].data}
//         handleFormUpdate={(seenLatestForm) => {
//             formObjSet(prevFormObj => {
//                 const newFormObj = { ...prevFormObj }
//                 if (newFormObj.checklist === undefined) return prevFormObj

//                 //edit new checklist item
//                 const newChecklistItem = { ...newFormObj.checklist[activeChecklistFormIndex] }
//                 if (newChecklistItem.type !== "form") return prevFormObj

//                 newChecklistItem.data = seenLatestForm

//                 newFormObj.checklist[activeChecklistFormIndex] = newChecklistItem

//                 return newFormObj
//             })
//         }}
//     />
// )}











































