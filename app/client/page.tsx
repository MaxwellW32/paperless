"use client"
import React, { useEffect, useState } from 'react'
import styles from "./page.module.css"
import { checklistStarter } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'

//ensure checklist only shows the forms to the client nothing else

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

    //get checklist starters
    useEffect(() => {
        const search = async () => {
            checklistStarterTypesSet(await getChecklistStartersTypes())
        }
        search()
    }, [])

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

            <div className={styles.mainContent}>
                {activeScreen !== undefined ? (
                    <>
                        {activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType !== undefined && (
                            <ChooseChecklistStarter seenChecklistStarterType={activeScreen.activeChecklistStarterType} />
                        )}
                    </>

                ) : (
                    <p>Choose a screen</p>
                )}
            </div>
        </main>
    )
}
