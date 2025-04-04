"use client"
import React, { useEffect, useState } from 'react'
import dashboardStyles from "@/app/dashboard.module.css"
import { activeScreenType, checklistItemType, checklistStarter, clientRequest, department, userDepartmentCompanySelection, refreshObjType } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal } from '@/utility/globalState'
import { getClientRequestsForDepartments, runChecklistAutomation, updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'
import { useSession } from 'next-auth/react'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import ViewClientRequest from '@/components/clientRequests/ViewClientRequest'

export default function Page() {
    const { data: session } = useSession()

    const [showingSideBar, showingSideBarSet] = useState(false)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>()

    const [refreshObj,] = useAtom<refreshObjType>(refreshObjGlobal)
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [activeClientRequests, activeClientRequestsSet] = useState<clientRequest[]>([])
    const [seenDepartment, seenDepartmentSet] = useState<department | undefined>()

    //get checklist starters
    useEffect(() => {
        const search = async () => {
            checklistStarterTypesSet(await getChecklistStartersTypes())
        }
        search()
    }, [])

    //search requests from company
    useEffect(() => {
        const search = async () => {
            if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userDepartment") return

            //get active requests needing this department signoff
            activeClientRequestsSet(await getClientRequestsForDepartments('in-progress', false, userDepartmentCompanySelection.seenUserToDepartment.departmentId, { departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId, allowRegularAccess: true }))
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

    if (session !== null && session.user.accessLevel !== "admin" && !session.user.fromDepartment) {
        return (
            <p>page for departments only</p>
        )
    }

    return (
        <main className={dashboardStyles.main} style={{ gridTemplateColumns: showingSideBar ? "auto 1fr" : "1fr" }}>
            <div className={dashboardStyles.sidebar} style={{ display: showingSideBar ? "" : "none" }}>
                <button className='button1'
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >close</button>

                {seenDepartment !== undefined && seenDepartment.canManageRequests && (
                    <>
                        <div className={dashboardStyles.newRequest}>
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
                    <div className={dashboardStyles.clientRequests}>
                        <h3>Active requests</h3>

                        {activeClientRequests.map(eachActiveClientRequest => {
                            if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userDepartment") return

                            //furthest non complete item
                            const activeChecklistItemIndex = eachActiveClientRequest.checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)

                            const activeChecklistItem: checklistItemType | undefined = activeChecklistItemIndex !== -1 ? eachActiveClientRequest.checklist[activeChecklistItemIndex] : undefined

                            return (
                                <div key={eachActiveClientRequest.id} className={dashboardStyles.eachClientRequest}>
                                    {eachActiveClientRequest.checklistStarter !== undefined && (
                                        <h3>{eachActiveClientRequest.checklistStarter.type}</h3>
                                    )}

                                    <label>{eachActiveClientRequest.status}</label>

                                    <div className={dashboardStyles.dateHolder}>
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

                                    {activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && activeChecklistItem.for.type === "department" && activeChecklistItem.for.departmenId === userDepartmentCompanySelection.seenUserToDepartment.departmentId && (
                                        <div>
                                            <label>{activeChecklistItem.prompt}</label>

                                            <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                                                runAction={async () => {
                                                    const newCompletedManualChecklistItem = activeChecklistItem
                                                    newCompletedManualChecklistItem.completed = true

                                                    //update server
                                                    const latestClientRequest = await updateClientRequestsChecklist(eachActiveClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, { clientRequestIdBeingAccessed: eachActiveClientRequest.id, departmentIdForAuth: userDepartmentCompanySelection.seenUserToDepartment.departmentId })

                                                    //run automation
                                                    await runChecklistAutomation(latestClientRequest.id, latestClientRequest.checklist, { clientRequestIdBeingAccessed: eachActiveClientRequest.id, departmentIdForAuth: userDepartmentCompanySelection.seenUserToDepartment.departmentId })

                                                    //refresh
                                                    //get latest specific request 
                                                    activeClientRequestsSet(prevClientRequests => {
                                                        const newClientRequests = prevClientRequests.map(eachClientRequestMap => {
                                                            if (eachClientRequestMap.id === latestClientRequest.id) {
                                                                return latestClientRequest
                                                            }

                                                            return eachClientRequestMap
                                                        })

                                                        return newClientRequests
                                                    })
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className={dashboardStyles.mainContent}>
                {!showingSideBar && (
                    <button className='button1' style={{ alignSelf: "flex-start" }}
                        onClick={() => {
                            showingSideBarSet(true)
                        }}
                    >open</button>
                )}

                {activeScreen !== undefined ? (
                    <>
                        {activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType !== undefined && seenDepartment !== undefined && (
                            <ChooseChecklistStarter seenChecklistStarterType={activeScreen.activeChecklistStarterType} seenDepartment={seenDepartment} />
                        )}

                        {activeScreen.type === "viewRequest" && seenDepartment !== undefined && (
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
