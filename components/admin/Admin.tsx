"use client"
import React, { useRef, useState } from 'react'
import styles from "./admin.module.css"
import { checklistStarter, department, company, userToDepartment, userToCompany, user, clientRequest, resourceAuthType, searchObj } from '@/types'
import { getChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { getDepartments } from '@/serverFunctions/handleDepartments'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import AddEditChecklistStarter from '../checklistStarters/AddEditChecklistStarter'
import { getUsersToDepartments } from '@/serverFunctions/handleUsersToDepartments'
import AddEditCompany from '../companies/AddEditCompany'
import AddEditDepartment from '../departments/AddEditDepartment'
import AddEditUserDepartment from '../usersToDepartments/AddEditUserDepartment'
import AddEditUserCompany from '../usersToCompanies/AddEditUserCompany'
import { getUsersToCompanies } from '@/serverFunctions/handleUsersToCompanies'
import * as schema from "@/db/schema"
import AddEditUser from '../users/AddEditUser'
import { getUsers } from '@/serverFunctions/handleUser'
import AddEditClientRequest from '../clientRequests/AddEditClientRequest'
import { getClientRequests } from '@/serverFunctions/handleClientRequests'
import DashboardClientRequest from '../clientRequests/DashboardClientRequest'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'
import Search from '../search/Search'

type schemaType = typeof schema;
type schemaTableNamesType = keyof schemaType;
type activeScreenType = schemaTableNamesType

export default function Page() {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const allTables = Object.keys(schema) as schemaTableNamesType[];
    const editableTables = allTables.filter(key => !key.endsWith("Relations") && !key.endsWith("Enum") && key !== "accounts" && key !== "sessions" && key !== "verificationTokens").sort((a, b) => a.localeCompare(b)) //get all tables defined in the schema, sort it alphabetically

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
    const [departmentsSearchObj, departmentsSearchObjSet] = useState<searchObj<department>>({
        searchItems: [],
    })
    const [companiesSearchObj, companiesSearchObjSet] = useState<searchObj<company>>({
        searchItems: [],
    })
    const [usersToDepartmentsSearchObj, usersToDepartmentsSearchObjSet] = useState<searchObj<userToDepartment>>({
        searchItems: [],
    })
    const [usersToCompaniesSearchObj, usersToCompaniesSearchObjSet] = useState<searchObj<userToCompany>>({
        searchItems: [],
    })

    const [adding, addingSet] = useState<Partial<{ [key in activeScreenType]: boolean }>>({})
    const [editing, editingSet] = useState<{
        users?: user,
        checklistStarters?: checklistStarter,
        clientRequests?: clientRequest,
        usersToDepartments?: userToDepartment,
        usersToCompanies?: userToCompany,
    }>({})

    const searchDebounce = useRef<NodeJS.Timeout>()

    return (
        <main className={styles.main} style={{ gridTemplateColumns: showingSideBar ? "auto 1fr" : "1fr" }}>
            <div className={styles.sidebar} style={{ display: showingSideBar ? "" : "none" }}>
                <button className='button1'
                    onClick={() => {
                        showingSideBarSet(false)
                    }}
                >close</button>

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

                    {editableTables.map(eachEditableTableName => {

                        return (
                            <option key={eachEditableTableName} value={eachEditableTableName}
                            >{eachEditableTableName}</option>
                        )
                    })}
                </select>
            </div>

            <div className={styles.mainContent}>
                <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                    {!showingSideBar && (
                        <button className='button1' style={{ alignSelf: "flex-start" }}
                            onClick={() => {
                                showingSideBarSet(true)
                            }}
                        >open</button>
                    )}

                    {activeScreen !== undefined ? (
                        <>
                            {activeScreen === "checklistStarters" && (
                                <>
                                    <AddResourceButton
                                        adding={adding}
                                        addingSet={addingSet}
                                        keyName={"checklistStarters"}
                                    />

                                    {adding.checklistStarters === true && (
                                        <AddEditChecklistStarter />
                                    )}

                                    <Search
                                        searchObj={checklistStartersSearchObj}
                                        searchObjSet={checklistStartersSearchObjSet}
                                        searchFunction={async () => {
                                            return await getChecklistStarters(checklistStartersSearchObj.limit, checklistStartersSearchObj.offset)
                                        }}
                                    />

                                    {checklistStartersSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {checklistStartersSearchObj.searchItems.map(eachCheckliststarter => {

                                                return (
                                                    <div key={eachCheckliststarter.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
                                                        <h3>{eachCheckliststarter.type}</h3>

                                                        {((editing.checklistStarters !== undefined && editing.checklistStarters.id === eachCheckliststarter.id) || (editing.checklistStarters === undefined)) && (
                                                            <>
                                                                <button className='button1'
                                                                    onClick={() => {
                                                                        editingSet(prevEditing => {
                                                                            const newEditing = { ...prevEditing }

                                                                            //set / reset editing
                                                                            newEditing.checklistStarters = newEditing.checklistStarters === undefined ? eachCheckliststarter : undefined

                                                                            return newEditing
                                                                        })
                                                                    }}
                                                                >{editing.checklistStarters !== undefined ? "cancel edit" : "edit checklistStarters"}</button>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {editing.checklistStarters !== undefined && (
                                        <>
                                            <h3>Edit form:</h3>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                <AddEditChecklistStarter
                                                    sentChecklistStarter={editing.checklistStarters}
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
                                        keyName={"clientRequests"}
                                    />

                                    {adding.clientRequests === true && (
                                        <>
                                            <AddEditClientRequest />
                                        </>
                                    )}

                                    <Search
                                        searchObj={clientRequestsSearchObj}
                                        searchObjSet={clientRequestsSearchObjSet}
                                        searchFunction={async () => {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")

                                            return await getClientRequests({ type: "all" }, { type: "date" }, resourceAuth, clientRequestsSearchObj.limit, clientRequestsSearchObj.offset)
                                        }}
                                    />

                                    {clientRequestsSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "300px", overflow: "auto" }} className='snap'>
                                            {clientRequestsSearchObj.searchItems.map(eachClientRequest => {
                                                if (eachClientRequest.checklistStarter === undefined || eachClientRequest.company === undefined) return null

                                                return (
                                                    <DashboardClientRequest key={eachClientRequest.id} style={{ backgroundColor: "rgb(var(--color2))" }}
                                                        eachClientRequest={eachClientRequest}
                                                        editButtonFunction={(editing.clientRequests === undefined) || (editing.clientRequests !== undefined && editing.clientRequests.id === eachClientRequest.id) ? () => {
                                                            editingSet(prevEditing => {
                                                                const newEditing = { ...prevEditing }

                                                                //set / reset editing
                                                                newEditing.clientRequests = newEditing.clientRequests === undefined ? eachClientRequest : undefined

                                                                return newEditing
                                                            })
                                                        } : undefined}
                                                    />
                                                )
                                            })}
                                        </div>
                                    )}

                                    {editing.clientRequests !== undefined && (
                                        <>
                                            <h3>Edit form:</h3>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                <AddEditClientRequest
                                                    sentClientRequest={editing.clientRequests}
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
                                        keyName={"companies"}
                                    />

                                    {adding.companies && (
                                        <AddEditCompany />
                                    )}

                                    <Search
                                        searchObj={companiesSearchObj}
                                        searchObjSet={companiesSearchObjSet}
                                        searchFunction={async () => {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")
                                            return await getCompanies(resourceAuth, companiesSearchObj.limit, companiesSearchObj.offset)
                                        }}
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
                                        keyName={"departments"}
                                    />

                                    {adding.departments && (
                                        <AddEditDepartment />
                                    )}

                                    <Search
                                        searchObj={departmentsSearchObj}
                                        searchObjSet={departmentsSearchObjSet}
                                        searchFunction={async () => {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")
                                            return await getDepartments(resourceAuth, departmentsSearchObj.limit, departmentsSearchObj.offset)
                                        }}
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

                            {activeScreen === "users" && (
                                <>
                                    <AddResourceButton
                                        adding={adding}
                                        addingSet={addingSet}
                                        keyName={"users"}
                                    />

                                    {adding.users && (
                                        <AddEditUser />
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
                                        searchFunction={async () => {
                                            return await getUsers({ type: "all" }, usersSearchObj.limit, usersSearchObj.offset)
                                        }}
                                    />

                                    {usersSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {usersSearchObj.searchItems.map(eachUser => {

                                                return (
                                                    <div key={eachUser.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
                                                        <h3>{eachUser.name}</h3>

                                                        {((editing.users !== undefined && editing.users.id === eachUser.id) || (editing.users === undefined)) && (
                                                            <>
                                                                <button className='button1'
                                                                    onClick={() => {
                                                                        editingSet(prevEditing => {
                                                                            const newEditing = { ...prevEditing }

                                                                            //set / reset editing
                                                                            newEditing.users = newEditing.users === undefined ? eachUser : undefined

                                                                            return newEditing
                                                                        })
                                                                    }}
                                                                >{editing.users !== undefined ? "cancel edit" : "edit users"}</button>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {editing.users !== undefined && (
                                        <>
                                            <h3>Edit form:</h3>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                <AddEditUser
                                                    sentUser={editing.users}
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
                                        keyName={"usersToDepartments"}
                                    />

                                    {adding.usersToDepartments === true && (
                                        <AddEditUserDepartment departmentsStarter={departmentsSearchObj.searchItems} />
                                    )}

                                    <h3>search by department</h3>

                                    <Search
                                        searchLabel='search departments'
                                        searchObj={departmentsSearchObj}
                                        searchObjSet={departmentsSearchObjSet}
                                        searchFunction={async () => {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")
                                            return await getDepartments(resourceAuth, departmentsSearchObj.limit, departmentsSearchObj.offset)
                                        }}
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
                                        searchFunction={async () => {
                                            return await getUsersToDepartments({ type: "all" }, usersToDepartmentsSearchObj.limit, usersToDepartmentsSearchObj.offset)
                                        }}
                                    />

                                    {usersToDepartmentsSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {usersToDepartmentsSearchObj.searchItems.map(eachUserToDepartment => {
                                                if (eachUserToDepartment.user === undefined || eachUserToDepartment.department === undefined) return null

                                                return (
                                                    <div key={eachUserToDepartment.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
                                                        <h3>{eachUserToDepartment.user.name}</h3>

                                                        <h3>{eachUserToDepartment.department.name}</h3>

                                                        <button className='button1'
                                                            onClick={() => {
                                                                editingSet(prevEditing => {
                                                                    const newEditing = { ...prevEditing }

                                                                    //set / reset editing
                                                                    newEditing.usersToDepartments = newEditing.usersToDepartments === undefined ? eachUserToDepartment : undefined

                                                                    return newEditing
                                                                })
                                                            }}
                                                        >{editing.usersToDepartments !== undefined ? "cancel edit" : "edit userToDepartment"}</button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {editing.usersToDepartments !== undefined && (
                                        <>
                                            <h3>Edit form:</h3>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                <AddEditUserDepartment
                                                    sentUserDepartment={editing.usersToDepartments}
                                                    departmentsStarter={departmentsSearchObj.searchItems}
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
                                        keyName={"usersToCompanies"}
                                    />

                                    {adding.usersToCompanies === true && (
                                        <AddEditUserCompany companiesStarter={companiesSearchObj.searchItems} />
                                    )}

                                    <h3>search by company</h3>

                                    <Search
                                        searchObj={companiesSearchObj}
                                        searchObjSet={companiesSearchObjSet}
                                        searchFunction={async () => {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")
                                            return await getCompanies(resourceAuth, companiesSearchObj.limit, companiesSearchObj.offset)
                                        }}
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
                                        searchFunction={async () => {
                                            return await getUsersToCompanies({ type: "all" }, usersToCompaniesSearchObj.limit, usersToCompaniesSearchObj.offset)
                                        }}
                                    />

                                    {usersToCompaniesSearchObj.searchItems.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                            {usersToCompaniesSearchObj.searchItems.map(eachUserToCompany => {
                                                if (eachUserToCompany.user === undefined || eachUserToCompany.company === undefined) return null

                                                return (
                                                    <div key={eachUserToCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
                                                        <h3>{eachUserToCompany.user.name}</h3>

                                                        <h3>{eachUserToCompany.company.name}</h3>

                                                        <button className='button1'
                                                            onClick={() => {
                                                                editingSet(prevEditing => {
                                                                    const newEditing = { ...prevEditing }

                                                                    //set / reset editing
                                                                    newEditing.usersToCompanies = newEditing.usersToCompanies === undefined ? eachUserToCompany : undefined

                                                                    return newEditing
                                                                })
                                                            }}
                                                        >{editing.usersToCompanies !== undefined ? "cancel edit" : "edit usersToCompanies"}</button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {editing.usersToCompanies !== undefined && (
                                        <>
                                            <h3>Edit form:</h3>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                <AddEditUserCompany
                                                    sentUserCompany={editing.usersToCompanies}
                                                    companiesStarter={companiesSearchObj.searchItems}
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