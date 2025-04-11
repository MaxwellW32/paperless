"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from "./page.module.css"
import { activeScreenType, checklistStarter, clientRequest, department, userDepartmentCompanySelection, refreshObjType, webSocketStandardMessageSchema, webSocketMessageJoinType, webSocketMessageJoinSchema, webSocketMessagePingType, webSocketStandardMessageType, refreshWSObjType, expectedResourceType, resourceAuthType } from '@/types'
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

export default function Page() {
    const { data: session } = useSession()
    const { sendWebsocketUpdate, } = useWebsockets(handleMessageFromWebsocket)

    //check if i can create a request
    const [clientRequestsExpectedResource,] = useState<expectedResourceType>({ type: "clientRequests", clientRequestId: "" })
    const clientRequestsAuthResponse = useResourceAuth(clientRequestsExpectedResource)

    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const [showingSideBar, showingSideBarSet] = useState(true)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
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

    //get checklist starters
    useEffect(() => {
        const search = async () => {
            checklistStarterTypesSet(await getChecklistStartersTypes())
        }
        search()
    }, [])

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

    //send ws update
    useEffect(() => {
        const search = async () => {
            if (refreshWSObj["clientRequests"] === undefined) return

            //if stuff in refreshObj, then update the client requests
            sendWebsocketUpdate({ type: "clientRequests" })
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
                <button className='button1'
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >close</button>

                {clientRequestsAuthResponse["c"] && (
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
                                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
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
                )}

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

                {clientRequestsHistory.length > 0 && (
                    <div className={styles.clientRequests}>
                        <h3>request history</h3>

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
                            <AddEditClientRequest seenChecklistStarterType={activeScreen.activeChecklistStarterType} department={seenDepartment} />
                        )}

                        {activeScreen.type === "viewRequest" && foundClientRequestToView !== undefined && (
                            <ViewClientRequest sentClientRequest={foundClientRequestToView} department={seenDepartment} />
                        )}

                        {activeScreen.type === "editRequest" && (
                            <AddEditClientRequest sentClientRequest={activeScreen.oldClientRequest} department={seenDepartment} />
                        )}
                    </>

                ) : (
                    <h3>Choose a screen</h3>
                )}
            </div>
        </main>
    )
}
