"use client"
import React, { useEffect, useMemo, useState } from 'react'
import styles from "./page.module.css"
import { activeScreenType, checklistStarter, clientRequest, department, userDepartmentCompanySelection, refreshObjType, refreshWSObjType, expectedResourceType, resourceAuthType, user, tape, equipmentT } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal, refreshWSObjGlobal, resourceAuthGlobal } from '@/utility/globalState'
import { getClientRequests, getClientRequestsForDepartments } from '@/serverFunctions/handleClientRequests'
import { useSession } from 'next-auth/react'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import ViewClientRequest from '@/components/clientRequests/ViewClientRequest'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { updateRefreshObj } from '@/utility/utility'
import AddEditClientRequest from '@/components/clientRequests/AddEditClientRequest'
import DashboardClientRequest from '@/components/clientRequests/DashboardClientRequest'
import useResourceAuth from '@/components/resourceAuth/UseLoad'
import useWebsockets from '@/components/websockets/UseWebsockets'
import { webSocketStandardMessageType } from '@/types/wsTypes'
import CompanyDepartmentSelection from '@/components/CompanyDepartmentSelection'
import { getSpecificUsers } from '@/serverFunctions/handleUser'
import { getTapes } from '@/serverFunctions/handleTapes'
import { getEquipment } from '@/serverFunctions/handleEquipment'
import ViewTape from '@/components/tapes/ViewTape'
import ViewEquipment from '@/components/equipment/ViewEquipment'

export default function Page() {
    const { data: session } = useSession()
    const { sendWebsocketUpdate, } = useWebsockets(handleMessageFromWebsocket)

    //check if i can create a request
    const [clientRequestsExpectedResource,] = useState<expectedResourceType>({ type: "clientRequests", clientRequestId: "" })
    const clientRequestsAuthResponse = useResourceAuth(clientRequestsExpectedResource)

    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const [showingSideBar, showingSideBarSet] = useState(true)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>()

    const [refreshObj, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [refreshWSObj,] = useAtom<refreshWSObjType>(refreshWSObjGlobal)

    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [activeClientRequests, activeClientRequestsSet] = useState<clientRequest[]>([])
    const [clientRequestsHistory, clientRequestsHistorySet] = useState<clientRequest[]>([])

    const [seenDepartment, seenDepartmentSet] = useState<department | undefined>()

    const foundClientRequestToView = useMemo<clientRequest | undefined>(() => {
        if (activeScreen === undefined || activeScreen.type !== "viewRequest") return undefined

        const foundClientRequest = [...activeClientRequests, ...clientRequestsHistory].find(eachClientRequest => eachClientRequest.id === activeScreen.clientRequestId)
        return foundClientRequest

    }, [activeScreen, activeClientRequests, clientRequestsHistory])

    const [seenUser, seenUserSet] = useState<user | undefined>()

    type overViewItemsType = {
        tapes: tape[],
        equipment: equipmentT[],
    }

    const [overViewItems, overViewItemsSet] = useState<overViewItemsType>({
        tapes: [],
        equipment: []
    })

    //get checklist starters
    useEffect(() => {
        const search = async () => {
            checklistStarterTypesSet(await getChecklistStartersTypes())
        }
        search()
    }, [])

    //get user
    useEffect(() => {
        const search = async () => {
            if (session === null) return

            seenUserSet(await getSpecificUsers(session.user.id))
        }
        search()
    }, [session])

    //search active client requests - update locally
    useEffect(() => {
        const search = async () => {
            try {
                if (session === null || resourceAuth === undefined) return

                let localNewClientRequests: clientRequest[] | undefined = undefined
                let localHistoryClientRequests: clientRequest[] | undefined = undefined

                //if admin
                if (session.user.accessLevel === "admin") {
                    //if app admin get all active requests
                    localNewClientRequests = await getClientRequests({ type: "all" }, { type: "status", status: 'in-progress', getOppositeOfStatus: false }, resourceAuth)

                    //get history
                    localHistoryClientRequests = await getClientRequests({ type: "all" }, { type: "status", status: 'in-progress', getOppositeOfStatus: true }, resourceAuth)

                } else {
                    if (userDepartmentCompanySelection === null) return

                    //if user is from department
                    if (userDepartmentCompanySelection.type === "userDepartment") {
                        //regular department user
                        localNewClientRequests = await getClientRequestsForDepartments('in-progress', false, userDepartmentCompanySelection.seenUserToDepartment.departmentId, resourceAuth)

                    } else if (userDepartmentCompanySelection.type === "userCompany") {
                        //set active requests from client
                        localNewClientRequests = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, }, { type: "status", status: 'in-progress', getOppositeOfStatus: false }, resourceAuth)

                        //set client requests history
                        localHistoryClientRequests = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, }, { type: "status", status: 'in-progress', getOppositeOfStatus: true }, resourceAuth)
                    }
                }

                if (localNewClientRequests !== undefined) {
                    activeClientRequestsSet(localNewClientRequests)
                }

                if (localHistoryClientRequests !== undefined) {
                    clientRequestsHistorySet(localHistoryClientRequests)
                }

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [session, userDepartmentCompanySelection, refreshObj["clientRequests"], resourceAuth])

    //search overview items - update locally
    useEffect(() => {
        const search = async () => {
            try {
                if (session === null || resourceAuth === undefined) return

                let localNewTapes: tape[] | undefined = undefined
                let localNewEquipment: equipmentT[] | undefined = undefined

                //if admin get latest tapes and equipment in general
                if (session.user.accessLevel === "admin") {
                    await Promise.all([1, 2].map(async each => {
                        if (each === 1) {
                            localNewTapes = await getTapes({ type: "all" }, resourceAuth)

                        } else if (each === 2) {
                            localNewEquipment = await getEquipment({ type: "all" }, resourceAuth)
                        }
                    }))

                } else {
                    //get tapes, equipment from company
                    if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type === "userDepartment") return

                    await Promise.all([1, 2].map(async each => {
                        if (each === 1) {
                            localNewTapes = await getTapes({ type: "allFromCompany", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth)

                        } else if (each === 2) {
                            localNewEquipment = await getEquipment({ type: "allFromCompany", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth)
                        }
                    }))
                }

                if ((localNewTapes !== undefined) || (localNewEquipment !== undefined)) {
                    overViewItemsSet(prevOverviewItems => {
                        const newOverviewItems = { ...prevOverviewItems }
                        if (localNewTapes !== undefined) {
                            newOverviewItems.tapes = localNewTapes
                        }

                        if (localNewEquipment !== undefined) {
                            newOverviewItems.equipment = localNewEquipment
                        }

                        return newOverviewItems
                    })
                }

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [session, userDepartmentCompanySelection, resourceAuth])

    //send ws update
    useEffect(() => {
        const search = async () => {
            if (refreshWSObj["clientRequests"] === undefined) return

            //if stuff in refreshObj, then update the client requests
            sendWebsocketUpdate({
                type: "clientRequests",
                update: {
                    type: "all",
                }
            })
        }
        search()

    }, [refreshWSObj["clientRequests"]])

    //search department - when user from a department only
    useEffect(() => {
        const search = async () => {
            if (resourceAuth === undefined || userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userDepartment") return

            seenDepartmentSet(await getSpecificDepartment(userDepartmentCompanySelection.seenUserToDepartment.departmentId, resourceAuth))
        }
        search()

    }, [userDepartmentCompanySelection, resourceAuth])

    //set viewing sidebar on desktop
    useEffect(() => {
        if (window.innerWidth < 600) {
            showingSideBarSet(false)
        }
    }, [])

    function handleMessageFromWebsocket(seenMessage: webSocketStandardMessageType) {
        if (seenMessage.type === "standard" && seenMessage.data.updated.type === "clientRequests") {
            //update locally
            refreshObjSet(prevRefreshObj => {
                return updateRefreshObj(prevRefreshObj, "clientRequests")
            })
        };
    }

    return (
        <main className={styles.main} style={{ gridTemplateColumns: showingSideBar ? "auto 1fr" : "1fr" }}>
            <div className={styles.sidebar} style={{ display: showingSideBar ? "" : "none" }}>
                <button style={{ justifySelf: "flex-end" }}
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                </button>

                <ul className={styles.dashboardMenu}>
                    {clientRequestsAuthResponse["c"] && (
                        <>
                            {activeScreen !== undefined && activeScreen.type === "newRequest" ? (
                                <>
                                    {checklistStarterTypes !== undefined && checklistStarterTypes.map(eachStarterType => {

                                        return (
                                            <li key={eachStarterType} className={`${activeScreen !== undefined && activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType === eachStarterType ? styles.highlighted : ""}`}>
                                                <button
                                                    onClick={() => {
                                                        activeScreenSet({
                                                            type: "newRequest",
                                                            activeChecklistStarterType: eachStarterType
                                                        })
                                                    }}

                                                >{eachStarterType}</button>
                                            </li>
                                        )
                                    })}

                                    <li>
                                        <button onClick={() => {
                                            activeScreenSet(undefined)
                                        }}>cancel</button>
                                    </li>
                                </>
                            ) : (
                                <li>
                                    <button onClick={() => {
                                        activeScreenSet({
                                            type: "newRequest",
                                            activeChecklistStarterType: undefined
                                        })
                                    }}>new request</button>
                                </li>
                            )}
                        </>
                    )}

                    <li className={`${activeScreen !== undefined && activeScreen.type === "pastRequests" ? styles.highlighted : ""}`}>
                        <button onClick={() => {
                            activeScreenSet({
                                type: "pastRequests",
                            })
                        }}>requests</button>
                    </li>

                    <li className={`${activeScreen !== undefined && activeScreen.type === "overview" ? styles.highlighted : ""}`}>
                        <button onClick={() => {
                            activeScreenSet({
                                type: "overview",
                            })
                        }}>overview</button>
                    </li>
                </ul>

                {activeClientRequests.length > 0 && (
                    <div className={styles.clientRequests}>
                        <h3>Active requests</h3>

                        {activeClientRequests.map(eachActiveClientRequest => {
                            return (
                                <DashboardClientRequest key={eachActiveClientRequest.id}
                                    eachClientRequest={eachActiveClientRequest} seenDepartment={seenDepartment}
                                    viewButtonFunction={() => {
                                        activeScreenSet({
                                            type: "viewRequest",
                                            clientRequestId: eachActiveClientRequest.id
                                        })
                                    }}
                                    editButtonFunction={() => {
                                        activeScreenSet({
                                            type: "editRequest",
                                            oldClientRequest: eachActiveClientRequest
                                        })
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            <div className={styles.mainContent}>
                {activeScreen === undefined ? (
                    <>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                            {!showingSideBar && (
                                <button
                                    onClick={() => {
                                        showingSideBarSet(true)
                                    }}
                                >
                                    <svg style={{ fill: "rgb(var(--shade1))", width: "1.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z" /></svg>
                                </button>
                            )}

                            <h1 className='noMargin'>dashboard</h1>

                            {seenUser !== undefined && (
                                <CompanyDepartmentSelection seenUser={seenUser} />
                            )}
                        </div>

                        <div className={styles.overviewCont}>
                            {clientRequestsHistory.length > 0 && (
                                <div>
                                    <h2 className='noMargin'>past requests</h2>

                                    <div className={styles.clientRequests}>
                                        {clientRequestsHistory.map(eachHistoryCientRequest => {
                                            return (
                                                <DashboardClientRequest key={eachHistoryCientRequest.id}
                                                    eachClientRequest={eachHistoryCientRequest} seenDepartment={seenDepartment}
                                                    viewButtonFunction={() => {
                                                        activeScreenSet({
                                                            type: "viewRequest",
                                                            clientRequestId: eachHistoryCientRequest.id
                                                        })
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {((overViewItems.tapes.length > 0) || (overViewItems.equipment.length > 0)) && (
                                <div>
                                    <h2 className='noMargin'>overview</h2>

                                    {overViewItems.tapes.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            <h2>tapes</h2>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                                                {overViewItems.tapes.map((eachTape, eachTapeIndex) => {
                                                    return (
                                                        <ViewTape key={eachTapeIndex} seenTape={eachTape} />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {overViewItems.equipment.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            <h2>equipment</h2>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                                                {overViewItems.equipment.map((eachEquipment, eachEquipmentIndex) => {
                                                    return (
                                                        <ViewEquipment key={eachEquipmentIndex} seenEquipment={eachEquipment} />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {activeScreen.type === "newRequest" && activeScreen.activeChecklistStarterType !== undefined && (
                            <AddEditClientRequest seenChecklistStarterType={activeScreen.activeChecklistStarterType} department={seenDepartment} />
                        )}

                        {activeScreen.type === "viewRequest" && foundClientRequestToView !== undefined && (
                            <ViewClientRequest sentClientRequest={foundClientRequestToView} department={seenDepartment} />
                        )}

                        {activeScreen.type === "editRequest" && (
                            <AddEditClientRequest sentClientRequest={activeScreen.oldClientRequest} department={seenDepartment} />
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
