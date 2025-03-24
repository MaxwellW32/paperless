"use client"
import React, { useEffect, useState } from 'react'
import Link from "next/link"
import { checklistStarter, clientRequest, departmentCompanySelection } from "@/types"
import { Session } from 'next-auth'
import styles from "./style.module.css"
import { useAtom } from 'jotai'
import { departmentCompanySelectionGlobal } from '@/utility/globalState'
import { getClientRequests } from '@/serverFunctions/handleClientRequests'

export default function HomeComp({ session, checklistStarterTypes }: { session: Session, checklistStarterTypes: checklistStarter["type"][] }) {
    const [showingSideBar, showingSideBarSet] = useState(false)
    const [departmentCompanySelection,] = useAtom<departmentCompanySelection | null>(departmentCompanySelectionGlobal)
    const [clientRequests, clientRequestsSet] = useState<clientRequest[]>([])

    useEffect(() => {
        handleSearchClientRequests()
    }, [])

    async function handleSearchClientRequests() {
        if (departmentCompanySelection === null || departmentCompanySelection.type == "department") return

        clientRequestsSet(await getClientRequests({ type: "company", companyId: departmentCompanySelection.companyId }, { companyIdBeingAccessed: departmentCompanySelection.companyId, allowRegularAccess: true }))
    }

    return (
        <div className={styles.main}>
            {!showingSideBar && (
                <button style={{ position: "absolute", right: 0 }} className='button1'
                    onClick={() => {
                        showingSideBarSet(true)
                    }}
                >open</button>
            )}

            <div className={styles.sideBar} style={{ display: showingSideBar ? "" : "none" }}>
                <button className='button1'
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >close</button>

                {clientRequests.length > 0 && (
                    <>
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
                    </>
                )}
            </div>

            <div className={styles.mainContent}>
                <h3>Welcome {session.user.name}</h3>

                <h3>new request</h3>

                <ul style={{ display: "flex", flexWrap: "wrap", padding: "1rem", gap: "1rem" }}>
                    {checklistStarterTypes.map((eachRequestType, eachRequestTypeIndex) => {
                        return (
                            <Link key={eachRequestTypeIndex} href={`clientRequests/${eachRequestType}`}
                            >
                                <button className="button1">{eachRequestType}</button>
                            </Link>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}
