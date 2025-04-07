"use client"
import React, { useRef, useState } from 'react'
import styles from "./admin.module.css"
import { checklistStarter, department, company, userToDepartment, userToCompany, user, clientRequest } from '@/types'
import { getChecklistStarters, getChecklistStartersTypes } from '@/serverFunctions/handleChecklistStarters'
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
import ChooseChecklistStarter from '../checklistStarters/ChooseChecklistStarter'

type schemaType = typeof schema;
type schemaTableNamesType = keyof schemaType;
type activeScreenType = schemaTableNamesType

export default function Page() {
    const allTables = Object.keys(schema) as schemaTableNamesType[];
    const editableTables = allTables.filter(key => !key.endsWith("Relations") && !key.endsWith("Enum") && key !== "accounts" && key !== "sessions" && key !== "verificationTokens").sort((a, b) => a.localeCompare(b)) //get all tables defined in the schema, sort it alphabetically

    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>(undefined)
    const [showingSideBar, showingSideBarSet] = useState(true)
    const [checklistStarterTypes, checklistStarterTypesSet] = useState<checklistStarter["type"][] | undefined>()
    const [chosenChecklistStarterType, chosenChecklistStarterTypeSet] = useState<checklistStarter["type"] | undefined>()

    const [users, usersSet] = useState<user[]>([])
    const [checklistStarters, checklistStartersSet] = useState<checklistStarter[]>([])
    const [clientRequests, clientRequestsSet] = useState<clientRequest[]>([])
    const [departments, departmentsSet] = useState<department[]>([])
    const [companies, companiesSet] = useState<company[]>([])
    const [usersToDepartments, usersToDepartmentsSet] = useState<userToDepartment[]>([])
    const [usersToCompanies, usersToCompaniesSet] = useState<userToCompany[]>([])

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

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                checklistStartersSet(await getChecklistStarters())

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    >search checklist starters</button>

                                    {checklistStarters.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                            {checklistStarters.map(eachCheckliststarter => {

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
                                            <button className='button3'
                                                onClick={async () => {
                                                    toast.success("searching")

                                                    checklistStarterTypesSet(await getChecklistStartersTypes())
                                                }}
                                            >search checklistStarters</button>

                                            <select defaultValue={""}
                                                onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                                    if (event.target.value === "") return

                                                    const eachStarterType = event.target.value as checklistStarter["type"]

                                                    chosenChecklistStarterTypeSet(eachStarterType)
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

                                            {chosenChecklistStarterType !== undefined && (
                                                <ChooseChecklistStarter seenChecklistStarterType={chosenChecklistStarterType} />
                                            )}
                                        </>
                                    )}

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                clientRequestsSet(await getClientRequests({ type: "all" }, { type: "date" }))

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    >search client requests</button>

                                    {clientRequests.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                                            {clientRequests.map(eachClientRequest => {
                                                if (eachClientRequest.checklistStarter === undefined || eachClientRequest.company === undefined) return null

                                                return (
                                                    <div key={eachClientRequest.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                        <h3>type: {eachClientRequest.checklistStarter.type}</h3>

                                                        <h3>company: {eachClientRequest.company.name}</h3>

                                                        {((editing.clientRequests !== undefined && editing.clientRequests.id === eachClientRequest.id) || (editing.clientRequests === undefined)) && (
                                                            <>
                                                                <button className='button1'
                                                                    onClick={() => {
                                                                        editingSet(prevEditing => {
                                                                            const newEditing = { ...prevEditing }

                                                                            //set / reset editing
                                                                            newEditing.clientRequests = newEditing.clientRequests === undefined ? eachClientRequest : undefined

                                                                            return newEditing
                                                                        })
                                                                    }}
                                                                >{editing.clientRequests !== undefined ? "cancel edit" : "edit clientRequests"}</button>
                                                            </>
                                                        )}
                                                    </div>
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

                                    {adding.companies === true && (
                                        <AddEditCompany />
                                    )}

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                companiesSet(await getCompanies())

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    >search companies</button>

                                    {companies.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                            {companies.map(eachCompany => {
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

                                    {adding.departments === true && (
                                        <AddEditDepartment />
                                    )}

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                departmentsSet(await getDepartments({ departmentIdBeingAccessed: "" }))

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    >search departments</button>

                                    {departments.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                            {departments.map(eachDepartment => {
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

                                    {adding.users === true && (
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

                                                    usersSet(await getUsers({ type: "name", name: e.target.value }))
                                                }, 1000);

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    />

                                    {users.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                            {users.map(eachUser => {

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
                                        <AddEditUserDepartment departmentsStarter={departments} />
                                    )}

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                departmentsSet(await getDepartments({ departmentIdBeingAccessed: "" }))

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    >search departments</button>

                                    {departments.length > 0 && (
                                        <>
                                            <h3>Select department to search</h3>

                                            <select defaultValue={""}
                                                onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                                    try {
                                                        if (event.target.value === "") return
                                                        toast.success("searching")

                                                        const eachDepartmentId = event.target.value as department["id"]

                                                        //search latest usersToDepartments
                                                        usersToDepartmentsSet(await getUsersToDepartments({ type: "department", departmentId: eachDepartmentId }))

                                                    } catch (error) {
                                                        consoleAndToastError(error)
                                                    }
                                                }}
                                            >
                                                <option value={""}
                                                >select</option>

                                                {departments.map(eachDepartment => {

                                                    return (
                                                        <option key={eachDepartment.id} value={eachDepartment.id}
                                                        >{eachDepartment.name}</option>
                                                    )
                                                })}
                                            </select>
                                        </>
                                    )}

                                    {usersToDepartments.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                            {usersToDepartments.map(eachUserToDepartment => {
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
                                                    departmentsStarter={departments}
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
                                        <AddEditUserCompany companiesStarter={companies} />
                                    )}

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                companiesSet(await getCompanies())

                                            } catch (error) {
                                                consoleAndToastError(error)
                                            }
                                        }}
                                    >search companies</button>

                                    {companies.length > 0 && (
                                        <>
                                            <h3>Select company to search</h3>

                                            <select defaultValue={""}
                                                onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                                    try {
                                                        if (event.target.value === "") return
                                                        toast.success("searching")

                                                        const eachCompanyId = event.target.value as company["id"]

                                                        //search latest usersToDepartments
                                                        usersToCompaniesSet(await getUsersToCompanies({ type: "company", companyId: eachCompanyId }))

                                                    } catch (error) {
                                                        consoleAndToastError(error)
                                                    }
                                                }}
                                            >
                                                <option value={""}
                                                >select</option>

                                                {companies.map(eachCompany => {
                                                    return (
                                                        <option key={eachCompany.id} value={eachCompany.id}
                                                        >{eachCompany.name}</option>
                                                    )
                                                })}
                                            </select>
                                        </>
                                    )}

                                    {usersToCompanies.length > 0 && (
                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                            {usersToCompanies.map(eachUserToCompany => {
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
                                                    companiesStarter={companies}
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