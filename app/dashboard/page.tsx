"use client"
import React, { useEffect, useState } from 'react'
import styles from "./page.module.css"
import { activeScreenType, checklistItemType, checklistStarter, clientRequest, department, userDepartmentCompanySelection, refreshObjType, clientRequestAuthType } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal } from '@/utility/globalState'
import { getClientRequests, getClientRequestsForDepartments, runChecklistAutomation, updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'
import { useSession } from 'next-auth/react'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import ViewClientRequest from '@/components/clientRequests/ViewClientRequest'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'

export default function Page() {
    const { data: session } = useSession()

    const [showingSideBar, showingSideBarSet] = useState(false)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>()

    const [refreshObj,] = useAtom<refreshObjType>(refreshObjGlobal)
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [activeClientRequests, activeClientRequestsSet] = useState<clientRequest[]>([])
    const [clientRequestsHistory, clientRequestsHistorySet] = useState<clientRequest[]>([])

    const [seenDepartment, seenDepartmentSet] = useState<department | undefined>()

    //get checklist starters
    useEffect(() => {
        const search = async () => {
            checklistStarterTypesSet(await getChecklistStartersTypes())
        }
        search()
    }, [])

    //search active client requests
    useEffect(() => {
        const search = async () => {
            try {
                if (session === null) return

                let newClientRequests: clientRequest[] | undefined = undefined
                let clientRequestsHistory: clientRequest[] | undefined = undefined

                //if admin
                if (session.user.accessLevel === "admin") {
                    //if app admin get all active requests
                    newClientRequests = await getClientRequests({ type: "all" }, 'in-progress', false)

                    //get history
                    clientRequestsHistory = await getClientRequests({ type: "all" }, 'in-progress', true)

                } else {
                    if (userDepartmentCompanySelection === null) return

                    //if user is from department
                    if (userDepartmentCompanySelection.type === "userDepartment") {
                        //regular department user
                        newClientRequests = await getClientRequestsForDepartments('in-progress', false, userDepartmentCompanySelection.seenUserToDepartment.departmentId, { departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId, allowElevatedAccess: true })

                    } else if (userDepartmentCompanySelection.type === "userCompany") {
                        //set active requests from client
                        newClientRequests = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, companyAuth: { companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId } }, 'in-progress', false)

                        //set client requests history
                        clientRequestsHistory = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, companyAuth: { companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId } }, 'in-progress', true)
                    }
                }

                if (newClientRequests !== undefined) {
                    activeClientRequestsSet(newClientRequests)
                }

                if (clientRequestsHistory !== undefined) {
                    clientRequestsHistorySet(clientRequestsHistory)
                }

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [userDepartmentCompanySelection, refreshObj["clientRequests"]])

    //search department
    useEffect(() => {
        const search = async () => {
            if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userDepartment") return

            seenDepartmentSet(await getSpecificDepartment(userDepartmentCompanySelection.seenUserToDepartment.departmentId, { departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId }))
        }
        search()

    }, [userDepartmentCompanySelection])

    if (session === null) {
        return (
            <p>Please login</p>
        )
    }

    const canAddNewRequest = (session.user.accessLevel === "admin") || (userDepartmentCompanySelection !== null && ((userDepartmentCompanySelection.type === "userCompany") || (userDepartmentCompanySelection.type === "userDepartment" && seenDepartment !== undefined && seenDepartment.canManageRequests)))

    return (
        <main className={styles.main} style={{ gridTemplateColumns: showingSideBar ? "auto 1fr" : "1fr" }}>
            <div className={styles.sidebar} style={{ display: showingSideBar ? "" : "none" }}>
                <button className='button1'
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >close</button>

                {canAddNewRequest && (
                    <>
                        <div className={styles.newRequest}>
                            <button className='button1'
                                onClick={() => {
                                    makingNewRequestSet(prev => {
                                        const newBool = !prev

                                        if (newBool) {
                                            //making a new request
                                            activeScreenSet({
                                                type: "newRequest",
                                                activeChecklistStarterType: undefined
                                            })
                                        } else {
                                            activeScreenSet(undefined)
                                        }

                                        return newBool
                                    })
                                }}
                            >{makingNewRequest ? "cancel" : "new request"}</button>

                            {makingNewRequest && activeScreen !== undefined && activeScreen.type === "newRequest" && (
                                <select value={activeScreen.activeChecklistStarterType}
                                    onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                        if (event.target.value === "") return

                                        const eachStarterType = event.target.value

                                        activeScreenSet({
                                            type: "newRequest",
                                            activeChecklistStarterType: eachStarterType
                                        })
                                    }}
                                >
                                    <option value={''}
                                    >select a request</option>

                                    {checklistStarterTypes !== undefined && checklistStarterTypes.map(eachStarterType => {

                                        return (
                                            <option key={eachStarterType} value={eachStarterType}

                                            >{eachStarterType}</option>
                                        )
                                    })}
                                </select>
                            )}
                        </div>
                    </>
                )}

                {activeClientRequests.length > 0 && (
                    <div className={styles.clientRequests}>
                        <h3>Active requests</h3>

                        {activeClientRequests.map(eachActiveClientRequest => {
                            //furthest non complete item
                            const activeChecklistItemIndex = eachActiveClientRequest.checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
                            const activeChecklistItem: checklistItemType | undefined = activeChecklistItemIndex !== -1 ? eachActiveClientRequest.checklist[activeChecklistItemIndex] : undefined

                            let canEditRequest = false
                            let newClientRequestAuth: clientRequestAuthType | undefined = undefined

                            //ensure can edit checklist item                            
                            if (activeChecklistItem !== undefined && activeChecklistItem.type === "manual") {
                                if (session.user.accessLevel === "admin") {
                                    canEditRequest = true
                                    newClientRequestAuth = { clientRequestIdBeingAccessed: eachActiveClientRequest.id }

                                } else {
                                    if (userDepartmentCompanySelection === null) return

                                    //if manual signoff is meant for department
                                    if (activeChecklistItem.for.type === "department" && userDepartmentCompanySelection.type === "userDepartment" && activeChecklistItem.for.departmenId === userDepartmentCompanySelection.seenUserToDepartment.departmentId) {
                                        canEditRequest = true
                                        newClientRequestAuth = { clientRequestIdBeingAccessed: eachActiveClientRequest.id, allowElevatedAccess: true }

                                        //if manual signoff is meant for company
                                    } else if (activeChecklistItem.for.type === "company" && userDepartmentCompanySelection.type === "userCompany" && activeChecklistItem.for.companyId === userDepartmentCompanySelection.seenUserToCompany.companyId) {
                                        canEditRequest = true
                                        newClientRequestAuth = { clientRequestIdBeingAccessed: eachActiveClientRequest.id }
                                    }
                                }
                            }

                            return (
                                <div key={eachActiveClientRequest.id} className={styles.eachClientRequest}>
                                    {eachActiveClientRequest.checklistStarter !== undefined && (
                                        <h3>{eachActiveClientRequest.checklistStarter.type}</h3>
                                    )}

                                    <label>{eachActiveClientRequest.status}</label>

                                    <div className={styles.dateHolder}>
                                        <p>{eachActiveClientRequest.dateSubmitted.toLocaleDateString()}</p>

                                        <p>{eachActiveClientRequest.dateSubmitted.toLocaleTimeString()}</p>
                                    </div>

                                    <button className='button2'
                                        onClick={() => {
                                            //making view request
                                            activeScreenSet({
                                                type: "viewRequest",
                                                clientRequest: eachActiveClientRequest
                                            })
                                        }}
                                    >view</button>

                                    {activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && canEditRequest && (
                                        <div>
                                            <label>{activeChecklistItem.prompt}</label>

                                            <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                                                runAction={async () => {
                                                    try {
                                                        if (newClientRequestAuth === undefined) return

                                                        const newCompletedManualChecklistItem = activeChecklistItem
                                                        newCompletedManualChecklistItem.completed = true

                                                        //update server
                                                        const latestClientRequest = await updateClientRequestsChecklist(eachActiveClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, newClientRequestAuth)

                                                        //run automation
                                                        await runChecklistAutomation(latestClientRequest.id, latestClientRequest.checklist, newClientRequestAuth)

                                                        //update the latest specific request 
                                                        activeClientRequestsSet(prevClientRequests => {
                                                            const newClientRequests = prevClientRequests.map(eachClientRequestMap => {
                                                                if (eachClientRequestMap.id === latestClientRequest.id) {
                                                                    return latestClientRequest
                                                                }

                                                                return eachClientRequestMap
                                                            })

                                                            return newClientRequests
                                                        })

                                                    } catch (error) {
                                                        consoleAndToastError(error)
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {clientRequestsHistory.length > 0 && (
                    <div className={styles.clientRequests}>
                        <h3>request history</h3>

                        {clientRequestsHistory.map(eachHistoryCientRequest => {
                            return (
                                <div key={eachHistoryCientRequest.id} className={styles.eachClientRequest}>
                                    {eachHistoryCientRequest.checklistStarter !== undefined && (
                                        <h3>{eachHistoryCientRequest.checklistStarter.type}</h3>
                                    )}

                                    <div className={styles.dateHolder}>
                                        <p>{eachHistoryCientRequest.dateSubmitted.toLocaleDateString()}</p>

                                        <p>{eachHistoryCientRequest.dateSubmitted.toLocaleTimeString()}</p>
                                    </div>

                                    <label style={{ backgroundColor: "rgb(var(--shade1))", color: "rgb(var(--shade2))", padding: "1rem", justifySelf: "flex-start", borderRadius: ".5rem" }}>{eachHistoryCientRequest.status}</label>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className={styles.mainContent}>
                {!showingSideBar && (
                    <button className='button1' style={{ alignSelf: "flex-start" }}
                        onClick={() => {
                            showingSideBarSet(true)
                        }}
                    >open</button>
                )}

                {activeScreen !== undefined ? (
                    <>
                        {activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType !== undefined && (
                            <ChooseChecklistStarter seenChecklistStarterType={activeScreen.activeChecklistStarterType} seenDepartment={seenDepartment} />
                        )}

                        {activeScreen.type === "viewRequest" && (
                            <ViewClientRequest sentClientRequest={activeScreen.clientRequest} department={seenDepartment} />
                        )}
                    </>

                ) : (
                    <h3>Choose a screen</h3>
                )}
            </div>
        </main>
    )
}
