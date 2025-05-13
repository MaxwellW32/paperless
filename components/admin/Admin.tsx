"use client"
import React, { useRef, useState } from 'react'
import styles from "./admin.module.css"
import { checklistStarter, department, company, userToDepartment, userToCompany, user, clientRequest, resourceAuthType, searchObj, tape, equipmentT } from '@/types'
import { getChecklistStarters, getSpecificChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { getDepartments, getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getCompanies, getSpecificCompany } from '@/serverFunctions/handleCompanies'
import AddEditChecklistStarter from '../checklistStarters/AddEditChecklistStarter'
import { getSpecificUsersToDepartments, getUsersToDepartments } from '@/serverFunctions/handleUsersToDepartments'
import AddEditCompany from '../companies/AddEditCompany'
import AddEditDepartment from '../departments/AddEditDepartment'
import AddEditUserDepartment from '../usersToDepartments/AddEditUserDepartment'
import AddEditUserCompany from '../usersToCompanies/AddEditUserCompany'
import { getSpecificUsersToCompanies, getUsersToCompanies } from '@/serverFunctions/handleUsersToCompanies'
import * as schema from "@/db/schema"
import AddEditUser from '../users/AddEditUser'
import { getSpecificUsers, getUsers } from '@/serverFunctions/handleUser'
import AddEditClientRequest from '../clientRequests/AddEditClientRequest'
import { getClientRequests, getSpecificClientRequest } from '@/serverFunctions/handleClientRequests'
import DashboardClientRequest from '../clientRequests/DashboardClientRequest'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'
import useWebsockets from '../websockets/UseWebsockets'
import { webSocketStandardMessageType } from '@/types/wsTypes'
import AddEditTape from '../tapes/AddEditTape'
import { getSpecificTapes, getTapes } from '@/serverFunctions/handleTapes'
import { getEquipment, getSpecificEquipment } from '@/serverFunctions/handleEquipment'
import AddEditEquipment from '../equipment/AddEditEquipment'
import Search from '../search/Search'

type schemaType = typeof schema;
type schemaTableNamesType = keyof schemaType;
type activeScreenType = schemaTableNamesType

type editingType = {
    users?: user,
    checklistStarters?: checklistStarter,
    clientRequests?: clientRequest,
    tapes?: tape,
    equipment?: equipmentT,
    usersToDepartments?: userToDepartment,
    usersToCompanies?: userToCompany,
}

export default function Page() {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)
    const { sendWebsocketUpdate, } = useWebsockets(handleMessageFromWebsocket, [resourceAuth])

    const allTableNames = Object.keys(schema) as schemaTableNamesType[];
    const allTables = allTableNames.filter(key => !key.endsWith("Relations") && !key.endsWith("Enum") && key !== "accounts" && key !== "sessions" && key !== "verificationTokens").sort((a, b) => a.localeCompare(b)) //get all tables defined in the schema, sort it alphabetically

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>(undefined)
    const [showingSideBar, showingSideBarSet] = useState(true)

    const [usersSearchObj, usersSearchObjSet] = useState<searchObj<user>>({
        searchItems: [],
    })
    const [checklistStartersSearchObj, checklistStartersSearchObjSet] = useState<searchObj<checklistStarter>>({
        searchItems: [],
    })
    const [clientRequestsSearchObj, clientRequestsSearchObjSet] = useState<searchObj<clientRequest>>({
        searchItems: [],
    })
    const [companiesSearchObj, companiesSearchObjSet] = useState<searchObj<company>>({
        searchItems: [],
    })
    const [departmentsSearchObj, departmentsSearchObjSet] = useState<searchObj<department>>({
        searchItems: [],
    })
    const [tapesSearchObj, tapesSearchObjSet] = useState<searchObj<tape>>({
        searchItems: [],
    })
    const [equipmentSearchObj, equipmentSearchObjSet] = useState<searchObj<equipmentT>>({
        searchItems: [],
    })
    const [usersToDepartmentsSearchObj, usersToDepartmentsSearchObjSet] = useState<searchObj<userToDepartment>>({
        searchItems: [],
    })
    const [usersToCompaniesSearchObj, usersToCompaniesSearchObjSet] = useState<searchObj<userToCompany>>({
        searchItems: [],
    })

    const [adding, addingSet] = useState<Partial<{ [key in activeScreenType]: boolean }>>({})
    const [editing, editingSet] = useState<editingType>({})

    const searchDebounce = useRef<NodeJS.Timeout>()

    type updateOption = { type: "all" } | { type: "specific", id: string }

    async function loadStarterValues<T>(sentActiveScreen: activeScreenType, updateOption: updateOption, runWebsocketUpdate = true): Promise<T[]> {
        if (resourceAuth === undefined) throw new Error("no auth seen")

        async function getResults<T>(updateOption: updateOption, specificFunction: () => Promise<T | undefined>, getAllFunction: () => Promise<T[]>): Promise<T[]> {
            let results: T[] = []

            if (updateOption.type === "specific") {
                const seenSpecificResult = await specificFunction()
                if (seenSpecificResult !== undefined) {
                    results = [(seenSpecificResult as T)]
                }

            } else if (updateOption.type === "all") {
                results = await getAllFunction()
            }

            return results
        }

        //perform update or new array
        function setSearchItemsOnSearchObj<T>(sentSearchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, searchItems: T[], seenUpdateOption: updateOption) {
            sentSearchObjSet(prevSearchObj => {
                const newSearchObj = { ...prevSearchObj }

                //handle update
                if (seenUpdateOption.type === "specific") {
                    //in array
                    //@ts-expect-error type
                    const inArrayAlready = newSearchObj.searchItems.find(eachSearchItem => eachSearchItem.id === seenUpdateOption.id) !== undefined

                    if (inArrayAlready) {
                        newSearchObj.searchItems = newSearchObj.searchItems.map(eachSearchItemMap => {
                            //@ts-expect-error type
                            if (eachSearchItemMap.id !== undefined && eachSearchItemMap.id === seenUpdateOption.id && searchItems[0] !== undefined) {//protection against empty arrays
                                return searchItems[0]
                            }

                            return eachSearchItemMap
                        })

                    } else {
                        newSearchObj.searchItems = [...newSearchObj.searchItems, searchItems[0]]
                    }

                } else if (seenUpdateOption.type === "all") {
                    newSearchObj.searchItems = searchItems
                }

                return newSearchObj
            })
        }

        function respondToResults(sentResults: unknown[]) {
            //tell of results
            if (sentResults.length === 0) {
                toast.error("not seeing anything")
            }
        }

        //send update off for other admins
        if (runWebsocketUpdate) {
            sendWebsocketUpdate({
                type: "adminPage",
                activeScreen: sentActiveScreen,
                update: updateOption
            })
        }

        if (sentActiveScreen === "checklistStarters") {
            const results = await getResults<checklistStarter>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificChecklistStarters({ type: "id", checklistId: updateOption.id })
                },
                async () => {
                    return await getChecklistStarters(checklistStartersSearchObj.limit, checklistStartersSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(checklistStartersSearchObjSet, results, updateOption)

            return results as T[]

        } else if (sentActiveScreen === "clientRequests") {
            const results = await getResults<clientRequest>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificClientRequest(updateOption.id, resourceAuth)
                },
                async () => {
                    return await getClientRequests({ type: "all" }, {}, resourceAuth, clientRequestsSearchObj.limit, clientRequestsSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(clientRequestsSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "companies") {
            const results = await getResults<company>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificCompany(updateOption.id, resourceAuth)
                },
                async () => {
                    return await getCompanies(resourceAuth, companiesSearchObj.limit, companiesSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(companiesSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "departments") {
            const results = await getResults<department>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificDepartment(updateOption.id, resourceAuth)
                },
                async () => {
                    return await getDepartments(resourceAuth, departmentsSearchObj.limit, departmentsSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(departmentsSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "tapes") {
            const results = await getResults<tape>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificTapes(updateOption.id, resourceAuth)
                },
                async () => {
                    return await getTapes({}, resourceAuth, tapesSearchObj.limit, tapesSearchObj.offset, { company: true })
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(tapesSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "equipment") {
            const results = await getResults<equipmentT>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificEquipment(updateOption.id, resourceAuth)
                },
                async () => {
                    return await getEquipment({}, resourceAuth, tapesSearchObj.limit, tapesSearchObj.offset, { company: true })
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(equipmentSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "users") {
            const results = await getResults<user>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificUsers(updateOption.id)
                },
                async () => {
                    return await getUsers({ type: "all" }, usersSearchObj.limit, usersSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(usersSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "usersToDepartments") {
            const results = await getResults<userToDepartment>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")

                    return await getSpecificUsersToDepartments({ type: "id", userDepartmentId: updateOption.id })
                },
                async () => {
                    return await getUsersToDepartments({ type: "all" }, usersToDepartmentsSearchObj.limit, usersToDepartmentsSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(usersToDepartmentsSearchObjSet, results, updateOption)

            return results as T[]


        } else if (sentActiveScreen === "usersToCompanies") {
            const results = await getResults<userToCompany>(updateOption,
                async () => {
                    if (updateOption.type !== "specific") throw new Error("incorrect updateOption sent")
                    return await getSpecificUsersToCompanies({ type: "id", userCompanyId: updateOption.id })
                },
                async () => {
                    return await getUsersToCompanies({ type: "all" }, usersToCompaniesSearchObj.limit, usersToCompaniesSearchObj.offset)
                },
            )

            //general send off
            respondToResults(results)

            //update state
            setSearchItemsOnSearchObj(usersToCompaniesSearchObjSet, results, updateOption)

            return results as T[]

        } else {
            throw new Error("invalid selection")
        }
    }

    //respond to updates from other admins
    async function handleMessageFromWebsocket(seenMessage: webSocketStandardMessageType) {
        if (seenMessage.type === "standard" && seenMessage.data.updated.type === "adminPage") {
            //update specific table
            //update the state
            await loadStarterValues(seenMessage.data.updated.activeScreen as activeScreenType, seenMessage.data.updated.update, false)
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
                    <svg style={{ fill: "rgb(var(--shade1))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                </button>

                <h3>Choose a screen</h3>

                <select value={activeScreen !== undefined ? activeScreen : ""}
                    onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                        if (event.target.value === "") return

                        const eachScreenOption = event.target.value as activeScreenType

                        activeScreenSet(eachScreenOption)
                    }}
                >
                    <option value={''}
                    >select a screen</option>

                    {allTables.map(eachEditableTableName => {

                        return (
                            <option key={eachEditableTableName} value={eachEditableTableName}
                            >{eachEditableTableName}</option>
                        )
                    })}
                </select>
            </div>

            <div className={styles.mainContent}>
                {!showingSideBar && (
                    <button style={{ alignSelf: "flex-start" }}
                        onClick={() => {
                            showingSideBarSet(true)
                        }}
                    >
                        <svg style={{ fill: "rgb(var(--shade1))", width: "1.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z" /></svg>
                    </button>
                )}

                {activeScreen !== undefined ? (
                    <>
                        {activeScreen === "checklistStarters" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.checklistStarters === true && (
                                    <AddEditChecklistStarter
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <Search
                                    searchObj={checklistStartersSearchObj}
                                    searchObjSet={checklistStartersSearchObjSet}
                                    searchFunc={async () => {
                                        return loadStarterValues<checklistStarter>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {checklistStartersSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {checklistStartersSearchObj.searchItems.map(eachCheckliststarter => {

                                                return (
                                                    <div key={eachCheckliststarter.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                                        <h3>{eachCheckliststarter.type}</h3>

                                                        <EditResourceButton
                                                            editing={editing}
                                                            editingSet={editingSet}
                                                            keyName={activeScreen}
                                                            eachObj={eachCheckliststarter}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.checklistStarters !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditChecklistStarter
                                                sentChecklistStarter={editing.checklistStarters}
                                                submissionAction={() => {
                                                    if (editing.checklistStarters === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.checklistStarters.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeScreen === "clientRequests" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.clientRequests === true && (
                                    <>
                                        <AddEditClientRequest
                                            submissionAction={() => {
                                                loadStarterValues(activeScreen, { type: "all" })
                                            }}
                                        />
                                    </>
                                )}

                                <Search
                                    searchObj={clientRequestsSearchObj}
                                    searchObjSet={clientRequestsSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<clientRequest>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {clientRequestsSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(400px, 90%)", overflow: "auto" }} className='snap'>
                                            {clientRequestsSearchObj.searchItems.map(eachClientRequest => {
                                                if (eachClientRequest.checklistStarter === undefined || eachClientRequest.company === undefined) return null

                                                return (
                                                    <DashboardClientRequest key={eachClientRequest.id} style={{ backgroundColor: "rgb(var(--color3))" }}
                                                        eachClientRequest={eachClientRequest}
                                                        editButtonComp={(
                                                            <EditResourceButton
                                                                editing={editing}
                                                                editingSet={editingSet}
                                                                keyName={activeScreen}
                                                                eachObj={eachClientRequest}
                                                            />
                                                        )}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.clientRequests !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditClientRequest
                                                sentClientRequest={editing.clientRequests}
                                                submissionAction={() => {
                                                    if (editing.clientRequests === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.clientRequests.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeScreen === "companies" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.companies && (
                                    <AddEditCompany
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <Search
                                    searchObj={companiesSearchObj}
                                    searchObjSet={companiesSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<company>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {companiesSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                        {companiesSearchObj.searchItems.map(eachCompany => {
                                            return (
                                                <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                    <h3>{eachCompany.name}</h3>

                                                    <Link href={`companies/edit/${eachCompany.id}`} target='_blank'>
                                                        <button className='button1'>edit company</button>
                                                    </Link>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {activeScreen === "departments" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.departments && (
                                    <AddEditDepartment
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <Search
                                    searchObj={departmentsSearchObj}
                                    searchObjSet={departmentsSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<department>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {departmentsSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                        {departmentsSearchObj.searchItems.map(eachDepartment => {
                                            return (
                                                <div key={eachDepartment.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                    <h3>{eachDepartment.name}</h3>

                                                    <Link href={`departments/edit/${eachDepartment.id}`} target='_blank'>
                                                        <button className='button1'>edit department</button>
                                                    </Link>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {activeScreen === "tapes" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.tapes && (
                                    <AddEditTape
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <Search
                                    searchObj={tapesSearchObj}
                                    searchObjSet={tapesSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<tape>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {tapesSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {tapesSearchObj.searchItems.map(eachTape => {
                                                if (eachTape.company === undefined) return null

                                                return (
                                                    <div key={eachTape.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                                        <h3>{eachTape.mediaLabel}</h3>

                                                        <h3>{eachTape.company.name}</h3>

                                                        <EditResourceButton
                                                            editing={editing}
                                                            editingSet={editingSet}
                                                            keyName={activeScreen}
                                                            eachObj={eachTape}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.tapes !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditTape
                                                sentTape={editing.tapes}
                                                submissionAction={() => {
                                                    if (editing.tapes === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.tapes.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeScreen === "equipment" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.equipment && (
                                    <AddEditEquipment
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <Search
                                    searchObj={equipmentSearchObj}
                                    searchObjSet={equipmentSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<equipmentT>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {equipmentSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {equipmentSearchObj.searchItems.map(eachEquipment => {
                                                if (eachEquipment.company === undefined) return null

                                                return (
                                                    <div key={eachEquipment.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                                        <h3>{eachEquipment.makeModel}</h3>

                                                        <h3>{eachEquipment.company.name}</h3>

                                                        <EditResourceButton
                                                            editing={editing}
                                                            editingSet={editingSet}
                                                            keyName={activeScreen}
                                                            eachObj={eachEquipment}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.equipment !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditEquipment
                                                sentEquipment={editing.equipment}
                                                submissionAction={() => {
                                                    if (editing.equipment === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.equipment.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeScreen === "users" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.users && (
                                    <AddEditUser
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <label>search users by name</label>

                                <input type='text' placeholder='enter name to search' defaultValue={""}
                                    onChange={async (e) => {
                                        try {
                                            if (searchDebounce.current) clearTimeout(searchDebounce.current)

                                            searchDebounce.current = setTimeout(async () => {
                                                if (e.target.value === "") return

                                                toast.success("searching")

                                                const seenUsers = await getUsers({ type: "name", name: e.target.value })

                                                usersSearchObjSet(prevUsersSearchObj => {
                                                    const newUsersSearchObj = { ...prevUsersSearchObj }

                                                    newUsersSearchObj.searchItems = seenUsers

                                                    return newUsersSearchObj
                                                })
                                            }, 1000);

                                        } catch (error) {
                                            consoleAndToastError(error)
                                        }
                                    }}
                                />

                                <label>search all</label>

                                <Search
                                    searchObj={usersSearchObj}
                                    searchObjSet={usersSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<user>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {usersSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {usersSearchObj.searchItems.map(eachUser => {

                                                return (
                                                    <div key={eachUser.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                                        <h3>{eachUser.name}</h3>

                                                        <EditResourceButton
                                                            editing={editing}
                                                            editingSet={editingSet}
                                                            keyName={activeScreen}
                                                            eachObj={eachUser}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.users !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditUser
                                                sentUser={editing.users}
                                                submissionAction={() => {
                                                    if (editing.users === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.users.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeScreen === "usersToDepartments" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.usersToDepartments === true && (
                                    <AddEditUserDepartment departmentsStarter={departmentsSearchObj.searchItems}
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <h3>search by department</h3>

                                <Search
                                    searchObj={departmentsSearchObj}
                                    searchObjSet={departmentsSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<department>("departments", { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {departmentsSearchObj.searchItems.length > 0 && (
                                    <>
                                        <h3>department selection</h3>

                                        <select defaultValue={""}
                                            onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                                try {
                                                    if (event.target.value === "") return
                                                    toast.success("searching")

                                                    const eachDepartmentId = event.target.value as department["id"]

                                                    const seenUsersToDepartments = await getUsersToDepartments({ type: "department", departmentId: eachDepartmentId })

                                                    //search latest usersToDepartments
                                                    usersToDepartmentsSearchObjSet(prevUsersToDepartmentsSearchObj => {
                                                        const newUsersToDepartmentsSearchObj = { ...prevUsersToDepartmentsSearchObj }

                                                        newUsersToDepartmentsSearchObj.searchItems = seenUsersToDepartments

                                                        return newUsersToDepartmentsSearchObj
                                                    })

                                                } catch (error) {
                                                    consoleAndToastError(error)
                                                }
                                            }}
                                        >
                                            <option value={""}
                                            >select</option>

                                            {departmentsSearchObj.searchItems.map(eachDepartment => {

                                                return (
                                                    <option key={eachDepartment.id} value={eachDepartment.id}
                                                    >{eachDepartment.name}</option>
                                                )
                                            })}
                                        </select>
                                    </>
                                )}

                                <h3>search all</h3>

                                <Search
                                    searchObj={usersToDepartmentsSearchObj}
                                    searchObjSet={usersToDepartmentsSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<userToDepartment>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {usersToDepartmentsSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {usersToDepartmentsSearchObj.searchItems.map(eachUserToDepartment => {
                                                if (eachUserToDepartment.user === undefined || eachUserToDepartment.department === undefined) return null

                                                return (
                                                    <div key={eachUserToDepartment.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                                        <h3>{eachUserToDepartment.user.name}</h3>

                                                        <h3>{eachUserToDepartment.department.name}</h3>

                                                        <EditResourceButton
                                                            editing={editing}
                                                            editingSet={editingSet}
                                                            keyName={activeScreen}
                                                            eachObj={eachUserToDepartment}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.usersToDepartments !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditUserDepartment
                                                sentUserDepartment={editing.usersToDepartments}
                                                departmentsStarter={departmentsSearchObj.searchItems}
                                                submissionAction={() => {
                                                    if (editing.usersToDepartments === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.usersToDepartments.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeScreen === "usersToCompanies" && (
                            <>
                                <AddResourceButton
                                    adding={adding}
                                    addingSet={addingSet}
                                    keyName={activeScreen}
                                />

                                {adding.usersToCompanies === true && (
                                    <AddEditUserCompany companiesStarter={companiesSearchObj.searchItems}
                                        submissionAction={() => {
                                            loadStarterValues(activeScreen, { type: "all" })
                                        }}
                                    />
                                )}

                                <h3>search by company</h3>

                                <Search
                                    searchObj={companiesSearchObj}
                                    searchObjSet={companiesSearchObjSet}
                                    searchFunc={async () => {
                                        if (resourceAuth === undefined) throw new Error("not seeing auth")
                                        return await loadStarterValues<company>("companies", { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {companiesSearchObj.searchItems.length > 0 && (
                                    <>
                                        <h3>Select company to search</h3>

                                        <select defaultValue={""}
                                            onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                                try {
                                                    if (event.target.value === "") return
                                                    toast.success("searching")

                                                    const eachCompanyId = event.target.value as company["id"]

                                                    const seenUsersToCompanies = await getUsersToCompanies({ type: "company", companyId: eachCompanyId })

                                                    //search latest usersToCompanies
                                                    usersToCompaniesSearchObjSet(prevUsersToCompaniesSearchObj => {
                                                        const newUsersToCompaniesSearchObj = { ...prevUsersToCompaniesSearchObj }

                                                        newUsersToCompaniesSearchObj.searchItems = seenUsersToCompanies

                                                        return newUsersToCompaniesSearchObj
                                                    })

                                                } catch (error) {
                                                    consoleAndToastError(error)
                                                }
                                            }}
                                        >
                                            <option value={""}
                                            >select</option>

                                            {companiesSearchObj.searchItems.map(eachCompany => {
                                                return (
                                                    <option key={eachCompany.id} value={eachCompany.id}
                                                    >{eachCompany.name}</option>
                                                )
                                            })}
                                        </select>
                                    </>
                                )}

                                <h3>search all</h3>

                                <Search
                                    searchObj={usersToCompaniesSearchObj}
                                    searchObjSet={usersToCompaniesSearchObjSet}
                                    searchFunc={async () => {
                                        return await loadStarterValues<userToCompany>(activeScreen, { type: "all" }, false)
                                    }}
                                    showPage={true}
                                    handleResults={false}
                                />

                                {usersToCompaniesSearchObj.searchItems.length > 0 && (
                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {usersToCompaniesSearchObj.searchItems.map(eachUserToCompany => {
                                                if (eachUserToCompany.user === undefined || eachUserToCompany.company === undefined) return null

                                                return (
                                                    <div key={eachUserToCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color3))", padding: "1rem" }}>
                                                        <h3>{eachUserToCompany.user.name}</h3>

                                                        <h3>{eachUserToCompany.company.name}</h3>

                                                        <EditResourceButton
                                                            editing={editing}
                                                            editingSet={editingSet}
                                                            keyName={activeScreen}
                                                            eachObj={eachUserToCompany}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {editing.usersToCompanies !== undefined && (
                                    <>
                                        <h3>Edit form:</h3>

                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <AddEditUserCompany
                                                sentUserCompany={editing.usersToCompanies}
                                                companiesStarter={companiesSearchObj.searchItems}
                                                submissionAction={() => {
                                                    if (editing.usersToCompanies === undefined) return

                                                    loadStarterValues(activeScreen, { type: "specific", id: editing.usersToCompanies.id })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <h3>Choose a screen</h3>
                )}
            </div>
        </main>
    )
}

function AddResourceButton({ keyName, adding, addingSet }: { keyName: activeScreenType, adding: Partial<{ [key in activeScreenType]: boolean }>, addingSet: React.Dispatch<React.SetStateAction<Partial<{ [key in activeScreenType]: boolean }>>> }) {
    return (
        <button className='button1'
            onClick={() => {
                addingSet(prevAdding => {
                    const newAdding = { ...prevAdding }
                    if (newAdding[keyName] === undefined) newAdding[keyName] = false

                    newAdding[keyName] = !newAdding[keyName]
                    return newAdding
                })
            }}
        >{adding[keyName] ? "close" : `add ${keyName}`}</button>
    )
}

function EditResourceButton<K extends keyof editingType>({ editing, editingSet, keyName, eachObj }: {
    editing: editingType,
    editingSet: React.Dispatch<React.SetStateAction<editingType>>,
    keyName: K,
    eachObj: NonNullable<editingType[K]>
}) {

    const viewingThisItem = editing[keyName] !== undefined && editing[keyName].id === eachObj.id

    return (
        <>
            <button className='button1' style={{ backgroundColor: viewingThisItem ? "rgb(var(--color1))" : "" }}
                onClick={() => {
                    editingSet(prevEditing => {
                        const newEditing = { ...prevEditing }

                        //toggle
                        newEditing[keyName] = newEditing[keyName] === undefined ? eachObj : undefined

                        return newEditing
                    })
                }}
            >{viewingThisItem ? "cancel edit" : `edit ${keyName}`}</button>
        </>
    )
}