"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from "./page.module.css"
import { activeScreenType, checklistItemType, checklistStarter, clientRequest, department, userDepartmentCompanySelection, refreshObjType, clientRequestAuthType, webSocketStandardMessageSchema, webSocketMessageJoinType, webSocketMessageJoinSchema, webSocketMessagePingType, webSocketStandardMessageType, refreshWSObjType } from '@/types'
import { getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
import ChooseChecklistStarter from '@/components/checklistStarters/ChooseChecklistStarter'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal, refreshObjGlobal, refreshWSObjGlobal } from '@/utility/globalState'
import { getClientRequests, getClientRequestsForDepartments, updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'
import { useSession } from 'next-auth/react'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import ViewClientRequest from '@/components/clientRequests/ViewClientRequest'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { updateRefreshObj } from '@/utility/utility'
import AddEditClientRequest from '@/components/clientRequests/AddEditClientRequest'
import { canUserAccessClientRequest } from '@/serverFunctions/handleAuth'

export default function Page() {
    const { data: session } = useSession()

    const [showingSideBar, showingSideBarSet] = useState(true)
    const [makingNewRequest, makingNewRequestSet] = useState(false)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>()

    const [refreshObj, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [refreshWSObj, refreshWSObjSet] = useAtom<refreshWSObjType>(refreshWSObjGlobal)

    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [activeClientRequests, activeClientRequestsSet] = useState<clientRequest[]>([])
    const [clientRequestsHistory, clientRequestsHistorySet] = useState<clientRequest[]>([])

    const [seenDepartment, seenDepartmentSet] = useState<department | undefined>()
    const wsRef = useRef<WebSocket | null>(null);
    const [, webSocketsConnectedSet] = useState(false)

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
                if (session === null) return

                let newClientRequests: clientRequest[] | undefined = undefined
                let clientRequestsHistory: clientRequest[] | undefined = undefined

                //if admin
                if (session.user.accessLevel === "admin") {
                    //if app admin get all active requests
                    newClientRequests = await getClientRequests({ type: "all" }, { type: "status", status: 'in-progress', getOppositeOfStatus: false })

                    //get history
                    clientRequestsHistory = await getClientRequests({ type: "all" }, { type: "status", status: 'in-progress', getOppositeOfStatus: true })

                } else {
                    if (userDepartmentCompanySelection === null) return

                    //if user is from department
                    if (userDepartmentCompanySelection.type === "userDepartment") {
                        //regular department user
                        newClientRequests = await getClientRequestsForDepartments('in-progress', false, userDepartmentCompanySelection.seenUserToDepartment.departmentId, { departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId, allowElevatedAccess: true })

                    } else if (userDepartmentCompanySelection.type === "userCompany") {
                        //set active requests from client
                        newClientRequests = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, companyAuth: { companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId } }, { type: "status", status: 'in-progress', getOppositeOfStatus: false })

                        //set client requests history
                        clientRequestsHistory = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, companyAuth: { companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId } }, { type: "status", status: 'in-progress', getOppositeOfStatus: true })
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

    //send ws update
    useEffect(() => {
        const search = async () => {
            if (refreshWSObj["clientRequests"] === undefined) return

            //if stuff in refreshObj, then update the client requests
            sendWebsocketUpdate({ type: "clientRequests" })
        }
        search()

    }, [refreshWSObj["clientRequests"]])

    //search department
    useEffect(() => {
        const search = async () => {
            if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type !== "userDepartment") return

            seenDepartmentSet(await getSpecificDepartment(userDepartmentCompanySelection.seenUserToDepartment.departmentId, { departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId }))
        }
        search()

    }, [userDepartmentCompanySelection])

    //set viewing sidebar on desktop
    useEffect(() => {
        if (window.innerWidth < 600) {
            showingSideBarSet(false)
        }
    }, [])

    //handle websockets
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            webSocketsConnectedSet(true);
            console.log(`$ws connected`);

            const newJoinMessage: webSocketMessageJoinType = {
                type: "join",
            }

            webSocketMessageJoinSchema.parse(newJoinMessage)

            //send request to join a website id room
            ws.send(JSON.stringify(newJoinMessage));
        };

        ws.onclose = () => {
            webSocketsConnectedSet(false);
        };

        ws.onmessage = (event) => {
            const seenMessage = webSocketStandardMessageSchema.parse(JSON.parse(event.data.toString()))

            if (seenMessage.type === "standard") {
                const seenMessageObj = seenMessage.data.updated

                if (seenMessageObj.type === "clientRequests") {
                    //update locally
                    refreshObjSet(prevRefreshObj => {
                        return updateRefreshObj(prevRefreshObj, "clientRequests")
                    })
                }
            };
        }

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const newPingMessage: webSocketMessagePingType = {
                    type: "ping"
                }

                //keep connection alive
                ws.send(JSON.stringify(newPingMessage));
                console.log(`$sent ping`);
            }
        }, 29000);

        return () => {
            clearInterval(pingInterval);

            if (wsRef.current !== null) {
                wsRef.current.close();
            }
        };
    }, [])

    function sendWebsocketUpdate(updateOption: webSocketStandardMessageType["data"]["updated"]) {
        const newWebSocketsMessage: webSocketStandardMessageType = {
            type: "standard",
            data: {
                updated: updateOption
            }
        }

        webSocketStandardMessageSchema.parse(newWebSocketsMessage)

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(newWebSocketsMessage));
        }
    }

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

                        {activeClientRequests.map(async eachActiveClientRequest => {
                            //furthest non complete item
                            const activeChecklistItemIndex = eachActiveClientRequest.checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
                            const activeChecklistItem: checklistItemType | undefined = activeChecklistItemIndex !== -1 ? eachActiveClientRequest.checklist[activeChecklistItemIndex] : undefined

                            let newClientRequestAuth: clientRequestAuthType = { clientRequestIdBeingAccessed: eachActiveClientRequest.id, departmentIdForAuth: userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userDepartment" ? userDepartmentCompanySelection.seenUserToDepartment.departmentId : undefined }
                            const progressBar: number | undefined = activeChecklistItemIndex !== -1 ? (activeChecklistItemIndex + 1) / eachActiveClientRequest.checklist.length : undefined

                            let canAccess = false

                            //ensure can edit checklist item                            
                            if (activeChecklistItem !== undefined && activeChecklistItem.type === "manual") {
                                //search 
                                canAccess = await canUserAccessClientRequest(newClientRequestAuth, "edit")
                            }

                            return (
                                <div key={eachActiveClientRequest.id} className={styles.eachClientRequest}>
                                    <div style={{ display: "grid", alignContent: "flex-start" }}>
                                        {eachActiveClientRequest.checklistStarter !== undefined && (
                                            <h3>{eachActiveClientRequest.checklistStarter.type}</h3>
                                        )}

                                        <div className={styles.dateHolder}>
                                            <p>{eachActiveClientRequest.dateSubmitted.toLocaleDateString()}</p>

                                            <p>{eachActiveClientRequest.dateSubmitted.toLocaleTimeString()}</p>
                                        </div>
                                    </div>

                                    <label>{eachActiveClientRequest.status}</label>

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", justifyContent: "flex-end" }}>
                                        <button style={{ justifySelf: "flex-end" }} className='button2'
                                            onClick={() => {
                                                //making view request
                                                activeScreenSet({
                                                    type: "viewRequest",
                                                    clientRequestId: eachActiveClientRequest.id
                                                })
                                            }}
                                        >view</button>

                                        {canAccess && (
                                            <button style={{ justifySelf: "flex-end" }} className='button2'
                                                onClick={() => {
                                                    //making view request
                                                    activeScreenSet({
                                                        type: "editRequest",
                                                        oldClientRequest: eachActiveClientRequest
                                                    })
                                                }}
                                            >edit</button>
                                        )}
                                    </div>

                                    {activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && canAccess && (
                                        <div>
                                            <label>{activeChecklistItem.prompt}</label>

                                            <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                                                runAction={async () => {
                                                    try {
                                                        const newCompletedManualChecklistItem = { ...activeChecklistItem }
                                                        newCompletedManualChecklistItem.completed = true

                                                        //update server
                                                        await updateClientRequestsChecklist(eachActiveClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, newClientRequestAuth)

                                                        //update locally
                                                        refreshObjSet(prevRefreshObj => {
                                                            return updateRefreshObj(prevRefreshObj, "clientRequests")
                                                        })

                                                        //send off ws
                                                        refreshWSObjSet(prevWSRefreshObj => {
                                                            return updateRefreshObj(prevWSRefreshObj, "clientRequests")
                                                        })

                                                    } catch (error) {
                                                        consoleAndToastError(error)
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                    {progressBar !== undefined && (
                                        <div style={{ position: "relative", height: ".25rem" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${progressBar * 100}%`, backgroundColor: "rgb(var(--color1))" }}></div>
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
