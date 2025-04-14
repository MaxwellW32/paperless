"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { cleanHourTimeRound, deepClone, offsetTime, updateRefreshObj, validateDynamicForm } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistStarter, clientRequest, company, department, userDepartmentCompanySelection, newClientRequest, newClientRequestSchema, refreshObjType, updateClientRequestSchema, userToCompany, checklistItemType, clientRequestStatusType, clientRequestSchema, resourceAuthType } from '@/types'
import { addClientRequests, updateClientRequests } from '@/serverFunctions/handleClientRequests'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal, refreshWSObjGlobal, resourceAuthGlobal } from '@/utility/globalState'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import { useSession } from 'next-auth/react'
import { getUsersToCompaniesWithVisitAccess } from '@/serverFunctions/handleUsersToCompanies'
import { getChecklistStarters, getSpecificChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { ReadDynamicForm } from '../makeReadDynamicChecklistForm/DynamicForm'
import { EditTapeForm } from '../forms/tapeForm/ViewEditTapeForm'
import TextInput from '../textInput/TextInput'
import { EditEquipmentForm } from '../forms/equipmentForm/ViewEditEquipmentForm'

export default function AddEditClientRequest({ seenChecklistStarterType, sentClientRequest, department, submissionAction }: { seenChecklistStarterType?: checklistStarter["type"], sentClientRequest?: clientRequest, department?: department, submissionAction?: () => void }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const { data: session } = useSession()
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshObjType>(refreshWSObjGlobal)

    const newDate = cleanHourTimeRound(new Date, 1)
    const [initialFormObj, initialFormObjSet] = useState<Partial<newClientRequest>>({
        companyId: undefined,
        checklist: undefined,
        checklistStarterId: undefined,
        clientsAccessingSite: [],
        eta: newDate,
    })
    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<clientRequest>>(deepClone(sentClientRequest === undefined ? initialFormObj : updateClientRequestSchema.parse(sentClientRequest)))

    const [chosenChecklistStarterType, chosenChecklistStarterTypeSet] = useState<checklistStarter["type"] | undefined>(seenChecklistStarterType)

    const [companies, companiesSet] = useState<company[]>([])

    const [usersToCompaniesWithAccess, usersToCompaniesWithAccessSet] = useState<userToCompany[] | undefined>(undefined)
    const [checklistStarters, checklistStartersSet] = useState<checklistStarter[]>([])

    const clientRequestStatusOptions: clientRequestStatusType[] = ["in-progress", "completed", "cancelled", "on-hold"]

    type clientRequestKeys = keyof Partial<clientRequest>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in clientRequestKeys]: string }>>({})

    //handle changes from above
    useEffect(() => {
        if (sentClientRequest === undefined) return

        formObjSet(deepClone(updateClientRequestSchema.parse(sentClientRequest)))

        //set the company id
        formObjSet(prevFormObj => {
            const newFormObj = { ...prevFormObj }

            newFormObj.companyId = sentClientRequest.companyId

            return newFormObj
        })

    }, [sentClientRequest])

    //listen to changes in seenChecklistStarterType
    useEffect(() => {
        if (seenChecklistStarterType === undefined) return

        //set the value
        chosenChecklistStarterTypeSet(seenChecklistStarterType)

    }, [seenChecklistStarterType])

    //load checklist starters if one was not provided
    useEffect(() => {
        //dont search if it was provided
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

                    const seenChecklistStarter = await getSpecificChecklistStarters({ type: "type", checklistType: chosenChecklistStarterType })
                    if (seenChecklistStarter === undefined) throw new Error("not seeing checklist")

                    //set the checklist and checklist id in the inital form obj - for when its time to reset
                    initialFormObjSet(prevInitialFormObj => {
                        const newInitialFormObj = { ...prevInitialFormObj }

                        //ensure fresh copy
                        newInitialFormObj.checklist = deepClone(seenChecklistStarter.checklist)
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
            //only run for clients accounts when company id undefined
            if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userCompany" || formObj.companyId !== undefined) return

            //set the active company id
            formObjSet((prevFormObj) => {
                const newFormObj = { ...prevFormObj }
                newFormObj.companyId = userDepartmentCompanySelection.seenUserToCompany.companyId
                return newFormObj
            })
        }
        search()

    }, [userDepartmentCompanySelection, formObj.companyId])

    //get company users with site access
    useEffect(() => {
        try {
            const search = async () => {
                if (formObj.companyId === undefined) return

                //search for users in this company with access to site
                handleSearchUsersToCompaniesWithAccess(formObj.companyId)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [formObj?.companyId])

    function checkIfValid(seenFormObj: Partial<clientRequest>, seenName: keyof Partial<clientRequest>, schema: typeof clientRequestSchema) {
        // @ts-expect-error type
        const testSchema = schema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }
                delete newObj[seenName]

                return newObj
            })

        } else {
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }

                let errorMessage = ""

                JSON.parse(testSchema.error.message).forEach((eachErrorObj: Error) => {
                    errorMessage += ` ${eachErrorObj.message}`
                })

                newObj[seenName] = errorMessage

                return newObj
            })
        }
    }

    function markLatestFormAsComplete(checklist: checklistItemType[]) {
        let firstFormIndex: number | undefined = undefined

        return checklist.map((eachChecklist, eachChecklistIndex) => {
            //complete the forms sent
            if (eachChecklist.type !== "form") return eachChecklist

            //assign first form
            if (firstFormIndex === undefined) {
                firstFormIndex = eachChecklistIndex
            }

            const prevIndex = eachChecklistIndex - 1
            const prevItem: checklistItemType | undefined = checklist[prevIndex]

            //scan each item
            //set the form to completed - only if first - or if prev was a form as well
            //return checklist with changed values

            //mark first seen form as complete
            if (eachChecklistIndex === firstFormIndex) {
                eachChecklist.completed = true

            } else if (prevItem !== undefined) {
                if (prevItem.type === "form" || prevItem.completed) {
                    //mark continous forms as complete, or forms with previous item completed
                    eachChecklist.completed = true
                }
            }

            return eachChecklist
        })
    }

    function validateForms(checklist: checklistItemType[]) {
        //ensure forms not null
        checklist.map(eachChecklist => {
            //only handle complete forms
            if (eachChecklist.type !== "form" || !eachChecklist.completed) return

            if (eachChecklist.form.type === "dynamic") {
                //dynamic form validation
                validateDynamicForm(eachChecklist.form.data)

            } else if (eachChecklist.form.type === "tapeDeposit" || eachChecklist.form.type === "tapeWithdraw" || eachChecklist.form.type === "equipmentDeposit" || eachChecklist.form.type !== "equipmentWithdraw") {
                //run for other forms
                if (eachChecklist.form.data === null) throw new Error("need to add to form")
            }
        })
    }

    async function handleSubmit() {
        try {
            //send off new client request
            if (formObj.companyId === undefined) throw new Error("not seeing company id")
            if (resourceAuth === undefined) throw new Error("not seeing auth")

            toast.success("submittting")

            if (sentClientRequest === undefined) {
                //make new client request

                //validate
                const validatedNewClientRequest: newClientRequest = newClientRequestSchema.parse(formObj)

                //mark as complete
                validatedNewClientRequest.checklist = markLatestFormAsComplete(validatedNewClientRequest.checklist)

                //form validation on complete forms 
                validateForms(validatedNewClientRequest.checklist)

                //send up to server
                await addClientRequests(validatedNewClientRequest, resourceAuth)

                toast.success("submitted")

                //reset
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedClientRequest = updateClientRequestSchema.parse(formObj)

                //mark as complete
                validatedUpdatedClientRequest.checklist = markLatestFormAsComplete(validatedUpdatedClientRequest.checklist)

                //form validation on complete forms 
                validateForms(validatedUpdatedClientRequest.checklist)

                //update
                await updateClientRequests(sentClientRequest.id, validatedUpdatedClientRequest, resourceAuth)

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

            if (submissionAction !== undefined) {
                submissionAction()
            }

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

    if (session === null) return null

    return (
        <form className={styles.form} action={() => { }}>
            {seenChecklistStarterType === undefined && sentClientRequest === undefined && (//show options to set the checklist to use only on new client requests
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

            {((session.user.accessLevel === "admin") || (userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userDepartment" && department !== undefined && department.canManageRequests)) && (//if admin or can manage requests show the pair company display
                <>
                    <label>company for request</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                        <button className='button1'
                            onClick={async () => {
                                try {
                                    if (resourceAuth === undefined) throw new Error("not seeing auth")

                                    toast.success("searching")

                                    companiesSet(await getCompanies(resourceAuth))

                                } catch (error) {
                                    consoleAndToastError(error)
                                }
                            }}
                        >get companies</button>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(250px, 90%)", overflow: "auto" }} className='snap'>
                            {companies.map(eachCompany => {
                                return (
                                    <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: eachCompany.id === formObj.companyId ? "rgb(var(--color3))" : "rgb(var(--color2))", padding: "1rem" }}>
                                        <h3>{eachCompany.name}</h3>

                                        <button className='button3'
                                            onClick={() => {
                                                toast.success(`selected`)

                                                formObjSet((prevFormObj) => {
                                                    const newFormObj = { ...prevFormObj }

                                                    newFormObj.companyId = eachCompany.id

                                                    return newFormObj
                                                })
                                            }}
                                        >select</button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {formObj.companyId !== undefined && (
                <button className='button3'
                    onClick={async () => {
                        try {
                            if (formObj.companyId === undefined) throw new Error("not seeing company id")
                            toast.success("searching")

                            //search 
                            handleSearchUsersToCompaniesWithAccess(formObj.companyId)

                        } catch (error) {
                            consoleAndToastError(error)
                        }
                    }}
                >refresh clients</button>
            )}

            {formObj.clientsAccessingSite !== undefined && usersToCompaniesWithAccess !== undefined && (
                <>
                    {usersToCompaniesWithAccess.length > 0 ? (
                        <>
                            <label>Clients visiting</label>

                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(250px, 90%)", overflow: "auto" }} className='snap'>
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
                        <>
                            <p>No users seen with facility access</p>
                            <p>Please ask our team to add visiting access for some users</p>
                        </>
                    )}
                </>
            )}

            {formObj.status !== undefined && session.user.accessLevel === "admin" && ( //for admin only show the form status
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

            {formObj.eta !== undefined && (
                <TextInput
                    name={`eta`}
                    value={offsetTime(new Date(formObj.eta), -5).toISOString().slice(0, 16)}
                    type={"datetime-local"}
                    label={"expected arrival"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        //set the checklist and checklist id
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.eta === undefined) return prevFormObj

                            newFormObj.eta = new Date(e.target.value)
                            return newFormObj
                        })
                    }}
                    onBlur={() => { checkIfValid(formObj, "eta", clientRequestSchema) }}
                    errors={formErrors["eta"]}
                />
            )}

            {formObj.checklist !== undefined && (
                <>
                    {session.user.accessLevel === "admin" && (
                        <label>checklist</label>
                    )}

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                        {formObj.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                            if (session === null || formObj.checklist === undefined) return null

                            //expected behaviour
                            //client should see nothin - cause 1st is a manual check
                            //then client should see 2 forms
                            //then client should still have access to those forms while manual is completed
                            //then client should have access to dynamic form

                            //can only show forms if
                            //if checklist form is completed...
                            //if incomplete form is first in checklist...
                            //if incomplete form has previous items completed...
                            //if incomplete form has previous item that is incomplete form

                            let canShowChecklistItem = false;

                            if (session.user.accessLevel === "admin") {
                                canShowChecklistItem = true;

                            } else if (eachChecklistItem.type === "form") {
                                canShowChecklistItem = true;
                            }

                            if (!canShowChecklistItem) return null;

                            return (
                                <div key={eachChecklistItemIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                    {session.user.accessLevel === "admin" && (
                                        <label>{eachChecklistItem.type}</label>
                                    )}

                                    {eachChecklistItem.type === "form" && (//refresh all forms when a new checklist type is loaded
                                        <React.Fragment key={formObj.checklistStarterId}>
                                            {eachChecklistItem.form.type === "dynamic" && (
                                                <ReadDynamicForm seenForm={eachChecklistItem.form.data} viewOnly={false}
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

                                            {formObj.companyId !== undefined && (
                                                <>
                                                    {((eachChecklistItem.form.type === "tapeDeposit") || (eachChecklistItem.form.type === "tapeWithdraw")) && (
                                                        <EditTapeForm seenForm={eachChecklistItem.form} seenCompanyId={formObj.companyId}
                                                            handleFormUpdate={(seenLatestForm) => {
                                                                formObjSet(prevFormObj => {
                                                                    const newFormObj = { ...prevFormObj }
                                                                    if (newFormObj.checklist === undefined) return prevFormObj

                                                                    //edit new checklist item
                                                                    const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                                    if (newChecklistItem.type !== "form") return prevFormObj
                                                                    if (newChecklistItem.form.type !== "tapeDeposit" && newChecklistItem.form.type !== "tapeWithdraw") return prevFormObj

                                                                    //set the new form data
                                                                    newChecklistItem.form = seenLatestForm

                                                                    newFormObj.checklist[eachChecklistItemIndex] = newChecklistItem

                                                                    return newFormObj
                                                                })
                                                            }}
                                                        />
                                                    )}

                                                    {((eachChecklistItem.form.type === "equipmentDeposit") || (eachChecklistItem.form.type === "equipmentWithdraw")) && (
                                                        <EditEquipmentForm seenForm={eachChecklistItem.form} seenCompanyId={formObj.companyId}
                                                            handleFormUpdate={(seenLatestForm) => {
                                                                formObjSet(prevFormObj => {
                                                                    const newFormObj = { ...prevFormObj }
                                                                    if (newFormObj.checklist === undefined) return prevFormObj

                                                                    //edit new checklist item
                                                                    const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                                    if (newChecklistItem.type !== "form") return prevFormObj
                                                                    if (newChecklistItem.form.type !== "equipmentDeposit" && newChecklistItem.form.type !== "equipmentWithdraw") return prevFormObj

                                                                    //set the new form data
                                                                    newChecklistItem.form = seenLatestForm

                                                                    newFormObj.checklist[eachChecklistItemIndex] = newChecklistItem

                                                                    return newFormObj
                                                                })
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </React.Fragment>
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