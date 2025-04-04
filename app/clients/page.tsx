"use client"
import React, { useEffect, useState } from 'react'
import dashboardStyles from "@/app/dashboard.module.css"
import { activeScreenType, checklistItemType, checklistStarter, clientRequest, departmentCompanySelection, refreshObjType } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'
import { useAtom } from 'jotai'
import { departmentCompanySelectionGlobal, refreshObjGlobal } from '@/utility/globalState'
import { getClientRequests, runChecklistAutomation, updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import AddEditClientRequest from '@/components/clientRequests/AddEditClientRequest'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'
import { useSession } from 'next-auth/react'

export default function Page() {
    const { data: session } = useSession()

    const [showingSideBar, showingSideBarSet] = useState(false)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>()

    const [refreshObj,] = useAtom<refreshObjType>(refreshObjGlobal)
    const [departmentCompanySelection,] = useAtom<departmentCompanySelection | null>(departmentCompanySelectionGlobal)
    const [activeClientRequests, activeClientRequestsSet] = useState<clientRequest[]>([])
    const [clientRequestsHistory, clientRequestsHistorySet] = useState<clientRequest[]>([])

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
            if (departmentCompanySelection === null || departmentCompanySelection.type !== "company") return

            //get active requests
            activeClientRequestsSet(await getClientRequests({ type: "company", companyId: departmentCompanySelection.companyId }, 'in-progress', false, { companyIdBeingAccessed: departmentCompanySelection.companyId, allowRegularAccess: true }))

            //get everything that is not in progress - request history
            clientRequestsHistorySet(await getClientRequests({ type: "company", companyId: departmentCompanySelection.companyId }, 'in-progress', true, { companyIdBeingAccessed: departmentCompanySelection.companyId, allowRegularAccess: true }))
        }
        search()

    }, [departmentCompanySelection, refreshObj["clientRequests"]])

    if (session !== null && session.user.accessLevel !== "admin" && session.user.fromDepartment) {
        return (
            <p>page for clients only</p>
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

                {activeClientRequests.length > 0 && (
                    <div className={dashboardStyles.clientRequests}>
                        <h3>Active requests</h3>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                            {activeClientRequests.map(eachActiveClientRequest => {
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

                                        {activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && activeChecklistItem.for.type === "company" && activeChecklistItem.for.companyId === eachActiveClientRequest.companyId && (
                                            <div>
                                                <label>{activeChecklistItem.prompt}</label>

                                                <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                                                    runAction={async () => {
                                                        const newCompletedManualChecklistItem = activeChecklistItem
                                                        newCompletedManualChecklistItem.completed = true

                                                        //update server
                                                        const latestClientRequest = await updateClientRequestsChecklist(eachActiveClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, { companyIdBeingAccessed: eachActiveClientRequest.companyId })

                                                        //run automation
                                                        await runChecklistAutomation(latestClientRequest.id, latestClientRequest.checklist, { companyIdBeingAccessed: eachActiveClientRequest.companyId })

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

                                        <button className='button2' style={{ justifySelf: "flex-end" }}
                                            onClick={() => {
                                                activeScreenSet({
                                                    type: "editRequest",
                                                    oldClientRequest: eachActiveClientRequest
                                                })
                                            }}
                                        >edit</button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {clientRequestsHistory.length > 0 && (
                    <div className={dashboardStyles.clientRequests}>
                        <h3>request history</h3>

                        {clientRequestsHistory.map(eachHistoryCientRequest => {
                            return (
                                <div key={eachHistoryCientRequest.id} className={dashboardStyles.eachClientRequest}>
                                    {eachHistoryCientRequest.checklistStarter !== undefined && (
                                        <h3>{eachHistoryCientRequest.checklistStarter.type}</h3>
                                    )}

                                    <div className={dashboardStyles.dateHolder}>
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
                        {activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType !== undefined && (
                            <ChooseChecklistStarter seenChecklistStarterType={activeScreen.activeChecklistStarterType} />
                        )}

                        {activeScreen.type === "editRequest" && (
                            <AddEditClientRequest sentClientRequest={activeScreen.oldClientRequest} />
                        )}
                    </>

                ) : (
                    <h3>Choose a screen</h3>
                )}
            </div>
        </main>
    )
}
