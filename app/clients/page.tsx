"use client"
import React, { useEffect, useState } from 'react'
import styles from "./page.module.css"
import { checklistStarter, clientRequest, departmentCompanySelection, refreshObjType } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'
import { useAtom } from 'jotai'
import { departmentCompanySelectionGlobal, refreshObjGlobal } from '@/utility/globalState'
import { getClientRequests } from '@/serverFunctions/handleClientRequests'

export default function Page() {
    const [showingSideBar, showingSideBarSet] = useState(false)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    type activeScreenType = {
        type: "newRequest",
        activeChecklistStarterType: checklistStarter["type"] | undefined
    } | {
        type: "history"
    }
    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>()

    const [refreshObj,] = useAtom<refreshObjType>(refreshObjGlobal)
    const [departmentCompanySelection,] = useAtom<departmentCompanySelection | null>(departmentCompanySelectionGlobal)
    const [clientRequests, clientRequestsSet] = useState<clientRequest[]>([])

    //get checklist starters
    useEffect(() => {
        const search = async () => {
            checklistStarterTypesSet(await getChecklistStartersTypes())
        }
        search()
    }, [])

    //search requests from company
    useEffect(() => {
        handleSearchClientRequests()
    }, [departmentCompanySelection, refreshObj["clientRequests"]])

    async function handleSearchClientRequests() {
        if (departmentCompanySelection === null || departmentCompanySelection.type !== "company") return

        clientRequestsSet(await getClientRequests({ type: "company", companyId: departmentCompanySelection.companyId }, { companyIdBeingAccessed: departmentCompanySelection.companyId, allowRegularAccess: true }))
    }

    return (
        <main className={styles.main}>
            {!showingSideBar && (
                <button className='button1' style={{ alignSelf: "flex-start" }}
                    onClick={() => {
                        showingSideBarSet(true)
                    }}
                >open</button>
            )}

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

                                console.log(`$eachStarterType`, eachStarterType);

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

                {clientRequests.length > 0 && (
                    <div className={styles.clientRequests}>
                        {/* show submitted requests - status, allow editing */}
                        <h3>Submitted requests</h3>

                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                            {clientRequests.map(eachClientRequest => {
                                return (
                                    <div key={eachClientRequest.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--shade2))", padding: "1rem" }}>
                                        {eachClientRequest.checklistStarter !== undefined && (
                                            <h3>{eachClientRequest.checklistStarter.type}</h3>
                                        )}

                                        <label style={{ backgroundColor: "rgb(var(--shade1))", color: "rgb(var(--shade2))", padding: "1rem", justifySelf: "flex-start", borderRadius: ".5rem" }}>{eachClientRequest.status}</label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.mainContent}>
                {activeScreen !== undefined ? (
                    <>
                        {activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType !== undefined && (
                            <ChooseChecklistStarter seenChecklistStarterType={activeScreen.activeChecklistStarterType} />
                        )}
                    </>

                ) : (
                    <h3>Choose a screen</h3>
                )}
            </div>
        </main>
    )
}
