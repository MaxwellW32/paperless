"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone, updateRefreshObj } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistStarter, clientRequest, company, department, userDepartmentCompanySelection, newClientRequest, newClientRequestSchema, refreshObjType, updateClientRequestSchema, userToCompany, checklistItemType, clientRequestAuthType, clientRequestStatusType } from '@/types'
import { addClientRequests, updateClientRequests } from '@/serverFunctions/handleClientRequests'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal, refreshWSObjGlobal } from '@/utility/globalState'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import { useSession } from 'next-auth/react'
import { getUsersToCompaniesWithVisitAccess } from '@/serverFunctions/handleUsersToCompanies'
import { getChecklistStarters, getSpecificChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { ReadDynamicChecklistForm } from '../makeReadDynamicChecklistForm/DynamicChecklistForm'
import { EditTapeDeposit } from '../forms/tapeDeposit/TapeDeposit'

export default function AddEditClientRequest({ seenChecklistStarterType, sentClientRequest, department }: { seenChecklistStarterType?: checklistStarter["type"], sentClientRequest?: clientRequest, department?: department }) {
    const { data: session } = useSession()
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshObjType>(refreshWSObjGlobal)

    const [initialFormObj, initialFormObjSet] = useState<Partial<newClientRequest>>({
        companyId: "",
        checklist: undefined,
        checklistStarterId: undefined,
        clientsAccessingSite: []
    })
    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<clientRequest>>(deepClone(sentClientRequest === undefined ? initialFormObj : updateClientRequestSchema.parse(sentClientRequest)))

    const [chosenChecklistStarterType, chosenChecklistStarterTypeSet] = useState<checklistStarter["type"] | undefined>(seenChecklistStarterType)

    const [activeCompanyId, activeCompanyIdSet] = useState<company["id"] | undefined>()
    const [companies, companiesSet] = useState<company[]>([])

    const [usersToCompaniesWithAccess, usersToCompaniesWithAccessSet] = useState<userToCompany[] | undefined>(undefined)
    const [checklistStarters, checklistStartersSet] = useState<checklistStarter[]>([])

    const clientRequestStatusOptions: clientRequestStatusType[] = ["in-progress", "completed", "cancelled", "on-hold"]

    //handle changes from above
    useEffect(() => {
        if (sentClientRequest === undefined) return

        formObjSet(deepClone(updateClientRequestSchema.parse(sentClientRequest)))

        //set company id
        activeCompanyIdSet(sentClientRequest.companyId)

    }, [sentClientRequest])

    //load checklist starters if checklistStarterType undefined
    useEffect(() => {
        if (seenChecklistStarterType !== undefined) return

        handleSearchChecklistStarters()

    }, [])

    //set the chosen checklist
    useEffect(() => {
        try {
            const search = async () => {
                try {
                    if (chosenChecklistStarterType === undefined) return

                    //ensure cant change checklist if updating a client request
                    if (sentClientRequest !== undefined) return

                    const seenChecklistStarter = await getSpecificChecklistStarters(chosenChecklistStarterType)
                    if (seenChecklistStarter === undefined) throw new Error("not seeing checklist")

                    //set the checklist and checklist id in the inital form obj - for when its time to reset
                    initialFormObjSet(prevInitialFormObj => {
                        const newInitialFormObj = { ...prevInitialFormObj }

                        newInitialFormObj.checklist = seenChecklistStarter.checklist
                        newInitialFormObj.checklistStarterId = seenChecklistStarter.id

                        return newInitialFormObj
                    })

                    //set the checklist and checklist id
                    formObjSet(prevFormObj => {
                        const newFormObj = { ...prevFormObj }

                        newFormObj.checklist = seenChecklistStarter.checklist
                        newFormObj.checklistStarterId = seenChecklistStarter.id

                        return newFormObj
                    })

                } catch (error) {
                    consoleAndToastError(error)
                }
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }

    }, [chosenChecklistStarterType])

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

    function markLatestFormAsComplete(checklist: checklistItemType[]) {
        const latestChecklistItemIndex = checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
        if (latestChecklistItemIndex === -1) return checklist

        //update in checklist
        checklist = checklist.map((eachChecklist, eachChecklistIndex) => {
            if (eachChecklistIndex === latestChecklistItemIndex) {
                //complete the forms sent
                eachChecklist.completed = true

                return eachChecklist
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

                console.log(`formObj`, formObj)

                //validate
                const validatedNewClientRequest: newClientRequest = newClientRequestSchema.parse(formObj)

                //mark as complete
                validatedNewClientRequest.checklist = markLatestFormAsComplete(validatedNewClientRequest.checklist)

                //send up to server
                await addClientRequests(validatedNewClientRequest, { companyIdForAuth: activeCompanyId, departmentIdForAuth: department !== undefined ? department.id : undefined })

                toast.success("submitted")

                //reset
                formObjSet(deepClone(initialFormObj))

                activeCompanyIdSet(undefined)

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

    async function handleSearchChecklistStarters() {
        try {
            checklistStartersSet(await getChecklistStarters())

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            {seenChecklistStarterType === undefined && sentClientRequest === undefined && (
                <>
                    <label>set the checklist starter</label>

                    <button className='button3'
                        onClick={handleSearchChecklistStarters}
                    >
                        search checklist starters
                    </button>

                    {checklistStarters.length > 0 && (
                        <div style={{ display: "flex", gap: "1rem", overflow: "auto" }}>
                            {checklistStarters.map(eachCheckliststarter => {

                                return (
                                    <div key={eachCheckliststarter.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", flex: "0 0 auto" }}>
                                        <h3>{eachCheckliststarter.type}</h3>

                                        <button className='button1' style={{ backgroundColor: eachCheckliststarter.type === chosenChecklistStarterType ? "rgb(var(--color1))" : "", }}
                                            onClick={() => {
                                                toast.success(`${eachCheckliststarter.type} selected`)

                                                chosenChecklistStarterTypeSet(eachCheckliststarter.type)
                                            }}
                                        >select</button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {((session !== null && session.user.accessLevel === "admin") || (department !== undefined && department.canManageRequests)) && (
                <>
                    <label>company for request</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                        <button className='button1'
                            onClick={async () => {
                                try {
                                    toast.success("searching")

                                    companiesSet(await getCompanies({ departmentIdForAuth: department !== undefined && department.canManageRequests ? department.id : undefined }))

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
                                toast.success("searching")

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
                            <label>Clients visiting</label>

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

            {formObj.status !== undefined && session !== null && session.user.accessLevel === "admin" && (
                <>
                    <label>status</label>

                    <select value={formObj.status}
                        onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                            const eachAccessLevel = event.target.value as clientRequestStatusType

                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.status === undefined) return prevFormObj

                                newFormObj.status = eachAccessLevel

                                return newFormObj
                            })
                        }}
                    >
                        {clientRequestStatusOptions.map(eachStatusOption => {

                            return (
                                <option key={eachStatusOption} value={eachStatusOption}
                                >{eachStatusOption}</option>
                            )
                        })}
                    </select>
                </>
            )}

            {formObj.checklist !== undefined && (
                <>
                    {session !== null && session.user.accessLevel === "admin" && (
                        <label>checklist</label>
                    )}

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                        {formObj.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                            let canShowCheckListItem = false
                            if (session === null) return null

                            if (session.user.accessLevel === "admin") {
                                canShowCheckListItem = true

                                //limit to only form view on client
                            } else if (eachChecklistItem.type === "form") {
                                canShowCheckListItem = true
                            }

                            if (!canShowCheckListItem) return null

                            return (
                                <div key={eachChecklistItemIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                    {session.user.accessLevel === "admin" && (
                                        <label>{eachChecklistItem.type}</label>
                                    )}

                                    {eachChecklistItem.type === "form" && (
                                        <>
                                            {eachChecklistItem.form.type === "dynamic" && (
                                                <ReadDynamicChecklistForm seenForm={eachChecklistItem.form.data}
                                                    handleFormUpdate={(seenLatestForm) => {
                                                        formObjSet(prevFormObj => {
                                                            const newFormObj = { ...prevFormObj }
                                                            if (newFormObj.checklist === undefined) return prevFormObj

                                                            //edit new checklist item
                                                            const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                            if (newChecklistItem.type !== "form" || newChecklistItem.form.type !== "dynamic") return prevFormObj

                                                            newChecklistItem.form.data = seenLatestForm

                                                            newFormObj.checklist[eachChecklistItemIndex] = newChecklistItem

                                                            return newFormObj
                                                        })
                                                    }}
                                                />
                                            )}

                                            {eachChecklistItem.form.type === "tapeDeposit" && (
                                                <EditTapeDeposit seenForm={eachChecklistItem.form.data}
                                                    handleFormUpdate={(seenLatestForm) => {
                                                        formObjSet(prevFormObj => {
                                                            const newFormObj = { ...prevFormObj }
                                                            if (newFormObj.checklist === undefined) return prevFormObj

                                                            //edit new checklist item
                                                            const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                            if (newChecklistItem.type !== "form" || newChecklistItem.form.type !== "tapeDeposit") return prevFormObj

                                                            //set the new form data
                                                            newChecklistItem.form.data = seenLatestForm

                                                            console.log(`seenLatestForm`, seenLatestForm)

                                                            newFormObj.checklist[eachChecklistItemIndex] = newChecklistItem

                                                            return newFormObj
                                                        })
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}

                                    {eachChecklistItem.type === "email" && (
                                        <>
                                            <label>to: </label>
                                            <p>{eachChecklistItem.to}</p>

                                            <label>subject: </label>
                                            <p>{eachChecklistItem.subject}</p>

                                            <label>email text: </label>
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



// type clientRequestKeys = keyof Partial<clientRequest>
// const [formErrors, formErrorsSet] = useState<Partial<{ [key in clientRequestKeys]: string }>>({})

// const [activeChecklistFormIndex, activeChecklistFormIndexSet] = useState<number | undefined>()

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