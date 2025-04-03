"use client"
import React, { useEffect, useState } from 'react'
import styles from "./page.module.css"
import { checklistItemType, checklistStarter, clientRequest, departmentCompanySelection, refreshObjType } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'
import { useAtom } from 'jotai'
import { departmentCompanySelectionGlobal, refreshObjGlobal } from '@/utility/globalState'
import { getClientRequests, updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import AddEditClientRequest from '@/components/clientRequests/AddEditClientRequest'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'

export default function Page() {
    const [showingSideBar, showingSideBarSet] = useState(false)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    type activeScreenType = {
        type: "newRequest",
        activeChecklistStarterType: checklistStarter["type"] | undefined
    } | {
        type: "editRequest",
        oldClientRequest: clientRequest
    }
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

    return (
        <main className={styles.main} style={{ gridTemplateColumns: showingSideBar ? "auto 1fr" : "1fr" }}>
            <div className={styles.sidebar} style={{ display: showingSideBar ? "" : "none" }}>
                <button className='button1'
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >close</button>

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

                {activeClientRequests.length > 0 && (
                    <div className={styles.activeClientRequests}>
                        <h3>Active requests</h3>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                            {activeClientRequests.map(eachActiveClientRequest => {
                                //furthest non complete item
                                const activeChecklistItemIndex = eachActiveClientRequest.checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
                                console.log(`$activeChecklistItemIndex`, activeChecklistItemIndex);

                                const activeChecklistItem: checklistItemType = eachActiveClientRequest.checklist[activeChecklistItemIndex]
                                console.log(`$activeChecklistItem`, activeChecklistItem);

                                console.log(`$eachActiveClientRequest.checklist`, eachActiveClientRequest.checklist);

                                return (
                                    <div key={eachActiveClientRequest.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--shade2))", padding: "1rem" }}>
                                        {eachActiveClientRequest.checklistStarter !== undefined && (
                                            <h3>{eachActiveClientRequest.checklistStarter.type}</h3>
                                        )}

                                        <label style={{ backgroundColor: "rgb(var(--shade1))", color: "rgb(var(--shade2))", padding: "1rem", justifySelf: "flex-start", borderRadius: ".5rem" }}>{eachActiveClientRequest.status}</label>

                                        <div style={{ display: "flex", gap: ".5rem", fontSize: "var(--fontSizeS)" }}>
                                            <p>{eachActiveClientRequest.dateSubmitted.toLocaleDateString()}</p>

                                            <p>{eachActiveClientRequest.dateSubmitted.toLocaleTimeString()}</p>
                                        </div>

                                        {activeChecklistItem.type === "manual" && activeChecklistItem.for.type === "company" && activeChecklistItem.for.companyId === eachActiveClientRequest.companyId && (
                                            <div>
                                                <label>{activeChecklistItem.prompt}</label>

                                                <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                                                    runAction={async () => {
                                                        const newCompletedManualChecklistItem = activeChecklistItem
                                                        newCompletedManualChecklistItem.completed = true

                                                        //update server
                                                        const latestClientRequest = await updateClientRequestsChecklist(eachActiveClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, { companyIdBeingAccessed: eachActiveClientRequest.companyId })

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
                    <div className={styles.activeClientRequests}>
                        <h3>request history</h3>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                            {clientRequestsHistory.map(eachHistoryCientRequest => {
                                return (
                                    <div key={eachHistoryCientRequest.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--shade2))", padding: "1rem" }}>
                                        {eachHistoryCientRequest.checklistStarter !== undefined && (
                                            <h3>{eachHistoryCientRequest.checklistStarter.type}</h3>
                                        )}

                                        <div style={{ display: "flex", gap: ".5rem", fontSize: "var(--fontSizeS)" }}>
                                            <p>{eachHistoryCientRequest.dateSubmitted.toLocaleDateString()}</p>

                                            <p>{eachHistoryCientRequest.dateSubmitted.toLocaleTimeString()}</p>
                                        </div>

                                        <label style={{ backgroundColor: "rgb(var(--shade1))", color: "rgb(var(--shade2))", padding: "1rem", justifySelf: "flex-start", borderRadius: ".5rem" }}>{eachHistoryCientRequest.status}</label>
                                    </div>
                                )
                            })}
                        </div>
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
