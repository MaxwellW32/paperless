"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone, offsetTime, updateRefreshObj } from '@/utility/utility'
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
import { ReadDynamicChecklistForm } from '../makeReadDynamicChecklistForm/DynamicChecklistForm'
import { EditTapeDepositForm } from '../forms/tapeDeposit/ViewEditTapeDepositForm'
import TextInput from '../textInput/TextInput'
import { EditTapeWithdrawForm } from '../forms/tapeWithdraw/ViewEditTapeWithdrawForm'

export default function AddEditClientRequest({ seenChecklistStarterType, sentClientRequest, department }: { seenChecklistStarterType?: checklistStarter["type"], sentClientRequest?: clientRequest, department?: department }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const { data: session } = useSession()
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshObjType>(refreshWSObjGlobal)

    const [initialFormObj, initialFormObjSet] = useState<Partial<newClientRequest>>({
        companyId: undefined,
        checklist: undefined,
        checklistStarterId: undefined,
        clientsAccessingSite: [],
        eta: `${new Date().toISOString()}`,
    })
    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<clientRequest>>(deepClone(sentClientRequest === undefined ? initialFormObj : updateClientRequestSchema.parse(sentClientRequest)))

    const [chosenChecklistStarterType, chosenChecklistStarterTypeSet] = useState<checklistStarter["type"] | undefined>(seenChecklistStarterType)

    // const [activeCompanyId, activeCompanyIdSet] = useState<company["id"] | undefined>()
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
            //only run for clients accounts
            if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userCompany") return

            //set the active company id
            formObjSet((prevFormObj) => {
                const newFormObj = { ...prevFormObj }
                newFormObj.companyId = userDepartmentCompanySelection.seenUserToCompany.companyId
                return newFormObj
            })
        }
        search()

    }, [userDepartmentCompanySelection])

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
        const latestChecklistItemIndex = checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
        if (latestChecklistItemIndex === -1) return checklist

        //update in checklist
        checklist = checklist.map((eachChecklist, eachChecklistIndex) => {
            if (eachChecklistIndex === latestChecklistItemIndex) {
                //complete the forms sent
                if (eachChecklist.type !== "form") return eachChecklist

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
            if (formObj.companyId === undefined) throw new Error("not seeing company id")
            if (resourceAuth === undefined) throw new Error("not seeing auth")

            toast.success("submittting")

            if (sentClientRequest === undefined) {
                //make new client request

                //validate
                const validatedNewClientRequest: newClientRequest = newClientRequestSchema.parse(formObj)

                //mark as complete
                validatedNewClientRequest.checklist = markLatestFormAsComplete(validatedNewClientRequest.checklist)

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

            {((session.user.accessLevel === "admin") || (department !== undefined && department.canManageRequests)) && (//if admin or can manage requests show the pair company display
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

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "250px", overflow: "auto" }} className='snap'>
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
                    value={offsetTime(formObj.eta, -5).slice(0, 16)}
                    type={"datetime-local"}
                    label={"expected arrival"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        //set the checklist and checklist id
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.eta === undefined) return prevFormObj

                            //convert to iso
                            newFormObj.eta = offsetTime(`${e.target.value}:00.000Z`, 5)
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
                            if (session === null) return null

                            let canShowCheckListItem = false

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

                                            {eachChecklistItem.form.type === "tapeDeposit" && formObj.companyId !== undefined && (
                                                <EditTapeDepositForm seenFormData={eachChecklistItem.form.data} seenCompanyId={formObj.companyId}
                                                    handleFormUpdate={(seenLatestForm) => {
                                                        formObjSet(prevFormObj => {
                                                            const newFormObj = { ...prevFormObj }
                                                            if (newFormObj.checklist === undefined) return prevFormObj

                                                            //edit new checklist item
                                                            const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                            if (newChecklistItem.type !== "form" || newChecklistItem.form.type !== "tapeDeposit") return prevFormObj

                                                            //set the new form data
                                                            newChecklistItem.form.data = seenLatestForm

                                                            newFormObj.checklist[eachChecklistItemIndex] = newChecklistItem

                                                            return newFormObj
                                                        })
                                                    }}
                                                />
                                            )}

                                            {eachChecklistItem.form.type === "tapeWithdraw" && formObj.companyId !== undefined && (
                                                <EditTapeWithdrawForm seenFormData={eachChecklistItem.form.data} seenCompanyId={formObj.companyId}
                                                    handleFormUpdate={(seenLatestForm) => {
                                                        formObjSet(prevFormObj => {
                                                            const newFormObj = { ...prevFormObj }
                                                            if (newFormObj.checklist === undefined) return prevFormObj

                                                            //edit new checklist item
                                                            const newChecklistItem = { ...newFormObj.checklist[eachChecklistItemIndex] }
                                                            if (newChecklistItem.type !== "form" || newChecklistItem.form.type !== "tapeWithdraw") return prevFormObj

                                                            //set the new form data
                                                            newChecklistItem.form.data = seenLatestForm

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