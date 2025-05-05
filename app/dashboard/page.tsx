"use client"
import React, { useEffect, useMemo, useState } from 'react'
import styles from "./page.module.css"
import { activeScreenType, checklistStarter, clientRequest, department, userDepartmentCompanySelection, refreshObjType, refreshWSObjType, expectedResourceType, resourceAuthType, user, tape, equipmentT, searchObj } from '@/types'
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
import Search from '@/components/search/Search'
import toast from 'react-hot-toast'

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
    // const [clientRequestsHistory, clientRequestsHistorySet] = useState<clientRequest[]>([])

    // type overViewItemsType = {
    //     tapes: tape[],
    //     equipment: equipmentT[],
    // }

    // const [overViewItems, overViewItemsSet] = useState<overViewItemsType>({
    //     tapes: [],
    //     equipment: []
    // })

    const [pastRequestsSearchObj, pastRequestsSearchObjSet] = useState<searchObj<clientRequest>>({
        searchItems: [],
    })

    const [tapesSearchObj, tapesSearchObjSet] = useState<searchObj<tape>>({
        searchItems: [],
    })

    const [equipmentSearchObj, equipmentSearchObjSet] = useState<searchObj<equipmentT>>({
        searchItems: [],
    })

    const [seenDepartment, seenDepartmentSet] = useState<department | undefined>()

    const foundClientRequestToView = useMemo<clientRequest | undefined>(() => {
        if (activeScreen === undefined || activeScreen.type !== "viewRequest") return undefined

        const foundClientRequest = [...activeClientRequests, ...pastRequestsSearchObj.searchItems].find(eachClientRequest => eachClientRequest.id === activeScreen.clientRequestId)
        return foundClientRequest

    }, [activeScreen, activeClientRequests, pastRequestsSearchObj.searchItems])

    const [seenUser, seenUserSet] = useState<user | undefined>()

    type specificResourceSearchType = {
        tapeSearch: tape["mediaLabel"],
        equipmentSearch: {
            type: "model",
            makeModel: equipmentT["makeModel"]
        } | {
            type: "serial",
            serialNumber: equipmentT["serialNumber"]
        },
    }
    const [specificResourceSearch, specificResourceSearchSet] = useState<specificResourceSearchType>({
        tapeSearch: "",
        equipmentSearch: {
            type: "model",
            makeModel: ""
        }
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

                //if admin
                if (session.user.accessLevel === "admin") {
                    //if app admin get all active requests
                    localNewClientRequests = await getClientRequests({ type: "all" }, { type: "status", status: 'in-progress', getOppositeOfStatus: false }, resourceAuth)

                    // //get history
                    // localHistoryClientRequests = await getClientRequests({ type: "all" }, { type: "status", status: 'in-progress', getOppositeOfStatus: true }, resourceAuth)

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
                        const seenHistoryClientRequests = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId, }, { type: "status", status: 'in-progress', getOppositeOfStatus: true }, resourceAuth)

                        //set initial history
                        pastRequestsSearchObjSet(prevSearchObj => {
                            const newSearchObj = { ...prevSearchObj }

                            newSearchObj.searchItems = seenHistoryClientRequests

                            return newSearchObj
                        })
                    }
                }

                if (localNewClientRequests !== undefined) {
                    activeClientRequestsSet(localNewClientRequests)
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

                //if admin get latest tapes and equipment in general
                if (session.user.accessLevel === "admin") {
                    //this enures that admin users get initial info on the dashboard page - but have to go to admin page to get further info
                    await Promise.all([1, 2].map(async each => {
                        if (each === 1) {
                            const localNewTapes = await getTapes({ type: "all" }, resourceAuth)
                            tapesSearchObjSet(prevSearchObj => {
                                const newSearchObj = { ...prevSearchObj }

                                newSearchObj.searchItems = localNewTapes

                                return newSearchObj
                            })


                        } else if (each === 2) {
                            const localNewEquipment = await getEquipment({ type: "all" }, resourceAuth)

                            equipmentSearchObjSet(prevSearchObj => {
                                const newSearchObj = { ...prevSearchObj }

                                newSearchObj.searchItems = localNewEquipment

                                return newSearchObj
                            })
                        }
                    }))

                } else {
                    //get tapes, equipment from company
                    loadResourceValues("tape", "all")

                    loadResourceValues("equipment", "all")
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

    function alertSearchResults<T>(items: T[]) {
        if (items.length === 0) {
            toast.error("not seeing anything")
        }
    }

    type optionType = "tape" | "equipment"
    type updateOptionType = "all" | "specific"

    //handle tapes and equipment for clients only
    async function loadResourceValues(option: optionType, updateOption: updateOptionType) {
        if (resourceAuth === undefined) throw new Error("no auth seen")
        if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type === "userDepartment") return

        async function getResults<T>(updateOption: updateOptionType, specificFunction: () => Promise<T[]>, getAllFunction: () => Promise<T[]>): Promise<T[]> {
            let results: T[] = []

            if (updateOption === "specific") {
                const seenSpecificResults = await specificFunction()

                if (seenSpecificResults.length > 0) {
                    results = seenSpecificResults
                }

            } else if (updateOption === "all") {
                results = await getAllFunction()
            }

            return results
        }

        //perform update or new array
        function setSearchItemsOnSearchObj<T>(sentSearchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, searchItems: T[]) {
            sentSearchObjSet(prevSearchObj => {
                const newSearchObj = { ...prevSearchObj }

                newSearchObj.searchItems = searchItems

                return newSearchObj
            })
        }

        function respondToResults(sentResults: unknown[]) {
            //tell of results
            if (sentResults.length === 0) {
                toast.error("not seeing anything")
            }
        }

        if (option === "tape") {
            const results = await getResults<tape>(updateOption,
                async () => {
                    if (updateOption !== "specific") throw new Error("incorrect updateOption sent")

                    return await getTapes({ type: "mediaLabel", mediaLabel: specificResourceSearch.tapeSearch, companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth, tapesSearchObj.limit, tapesSearchObj.offset)
                },
                async () => {
                    return await getTapes({ type: "allFromCompany", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth, tapesSearchObj.limit, tapesSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(tapesSearchObjSet, results)

        } else if (option === "equipment") {
            const results = await getResults<equipmentT>(updateOption,
                async () => {
                    if (updateOption !== "specific") throw new Error("incorrect updateOption sent")

                    if (specificResourceSearch.equipmentSearch.type === "model") {
                        return await getEquipment({ type: "makeModel", makeModel: specificResourceSearch.equipmentSearch.makeModel, companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth, equipmentSearchObj.limit, equipmentSearchObj.offset)

                    } else {//handle serial number search
                        return await getEquipment({ type: "serialNumber", serialNumber: specificResourceSearch.equipmentSearch.serialNumber, companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth, equipmentSearchObj.limit, equipmentSearchObj.offset)
                    }

                },
                async () => {
                    return await getEquipment({ type: "allFromCompany", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, resourceAuth, equipmentSearchObj.limit, equipmentSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(equipmentSearchObjSet, results)
        }
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
                    <button
                        onClick={() => {
                            activeScreenSet(undefined)
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" /></svg>
                    </button>

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
                                </>
                            ) : (
                                <li>
                                    <button
                                        onClick={() => {
                                            activeScreenSet({
                                                type: "newRequest",
                                                activeChecklistStarterType: undefined
                                            })
                                        }}
                                    >new request</button>
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

            <div className={styles.mainContent} style={{ backgroundColor: activeScreen === undefined ? "rgb(var(--color3))" : "rgb(var(--shade2))" }}>
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
                            {pastRequestsSearchObj.searchItems.length > 0 && (
                                <div>
                                    <h2 className='noMargin'>past requests</h2>

                                    <div className={styles.clientRequests}>
                                        {pastRequestsSearchObj.searchItems.map(eachHistoryCientRequest => {
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

                            {((tapesSearchObj.searchItems.length > 0) || (equipmentSearchObj.searchItems.length > 0)) && (
                                <div>
                                    <h2 className='noMargin'>overview</h2>

                                    {tapesSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            <h2>tapes</h2>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                                                {tapesSearchObj.searchItems.map((eachTape, eachTapeIndex) => {
                                                    return (
                                                        <ViewTape key={eachTapeIndex} seenTape={eachTape} />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {equipmentSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            <h2>equipment</h2>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                                                {equipmentSearchObj.searchItems.map((eachEquipment, eachEquipmentIndex) => {
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

                        {activeScreen.type === "pastRequests" && (
                            <>
                                <h2>past requests</h2>

                                <Search
                                    searchObj={pastRequestsSearchObj}
                                    searchObjSet={pastRequestsSearchObjSet}
                                    searchFunction={async () => {
                                        //get all past requests for client only
                                        if (resourceAuth === undefined) return

                                        if (userDepartmentCompanySelection === null || userDepartmentCompanySelection.type === "userDepartment") return

                                        const seenClientRequests = await getClientRequests({ type: "company", companyId: userDepartmentCompanySelection.seenUserToCompany.companyId }, { type: "date" }, resourceAuth, pastRequestsSearchObj.limit, pastRequestsSearchObj.offset)

                                        //alert
                                        alertSearchResults(seenClientRequests)

                                        //set
                                        pastRequestsSearchObjSet(prevSearchObj => {
                                            const newSearchObj = { ...prevSearchObj }

                                            newSearchObj.searchItems = seenClientRequests

                                            return newSearchObj
                                        })
                                    }}
                                />

                                <div className={styles.clientRequests}>
                                    {pastRequestsSearchObj.searchItems.map(eachHistoryCientRequest => {
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
                            </>
                        )}

                        {activeScreen.type === "overview" && (
                            <>
                                <h2>overview</h2>

                                <h2>tapes</h2>

                                <Search
                                    searchObj={tapesSearchObj}
                                    searchObjSet={tapesSearchObjSet}
                                    searchFunction={() => {
                                        loadResourceValues("tape", "all")
                                    }}
                                    showPage={true}
                                />

                                {tapesSearchObj.searchItems.length > 0 && (
                                    <>
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                                                {tapesSearchObj.searchItems.map((eachTape, eachTapeIndex) => {
                                                    return (
                                                        <ViewTape key={eachTapeIndex} seenTape={eachTape} />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <h2>equipment</h2>

                                <Search
                                    searchObj={equipmentSearchObj}
                                    searchObjSet={equipmentSearchObjSet}
                                    searchFunction={() => {
                                        loadResourceValues("equipment", "all")
                                    }}
                                />

                                {equipmentSearchObj.searchItems.length > 0 && (
                                    <>
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                                                {equipmentSearchObj.searchItems.map((eachEquipment, eachEquipmentIndex) => {
                                                    return (
                                                        <ViewEquipment key={eachEquipmentIndex} seenEquipment={eachEquipment} />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
