"use client"
import React, { useEffect, useMemo, useState } from 'react'
import styles from "./admin.module.css"
import { checklistStarter, department, company, userToDepartment } from '@/types'
import { getChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { getDepartments } from '@/serverFunctions/handleDepartments'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import ShowMore from '../showMore/ShowMore'
import AddEditChecklistStarter from '../checklistStarters/AddEditChecklistStarter'
import { getUsersToDepartments } from '@/serverFunctions/handleUsersToDepartments'
import AddEditCompany from '../companies/AddEditCompany'
import AddEditDepartment from '../departments/AddEditDepartment'
import AddEditUserDepartment from '../usersToDepartments/AddEditUserDepartment'
import AddEditUserCompany from '../usersToCompanies/AddEditUserCompany'

export default function Page() {
    const activeScreenOptions = ["checklistStarters", "departments", "companies", "usersToDepartments", "usersToCompanies"] as const
    type activeScreenType = typeof activeScreenOptions[number]
    const [activeScreen, activeScreenSet] = useState<activeScreenType | undefined>(undefined)

    const [showingSideBar, showingSideBarSet] = useState(true)
    const [departments, departmentsSet] = useState<department[]>([])
    const [companies, companiesSet] = useState<company[]>([])
    const [usersToDepartments, usersToDepartmentsSet] = useState<userToDepartment[]>([])
    const [adding, addingSet] = useState<Partial<{ [key in activeScreenType]: boolean }>>({})
    const [editing, editingSet] = useState<{
        usersToDepartments?: {
            userToDepartmentId: userToDepartment["id"]
        }
    }>({})

    //usersToDepartments - get by department - selection menu
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

                    {activeScreenOptions.map(eachActiveScreenOption => {

                        return (
                            <option key={eachActiveScreenOption} value={eachActiveScreenOption}
                            >{eachActiveScreenOption}</option>
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
                                <ShowMore
                                    label='checklist starters'
                                    content={
                                        <ChecklistStartersScreen />
                                    }
                                />
                            )}

                            {activeScreen === "departments" && (
                                <>
                                    <button className='button1'
                                        onClick={() => {
                                            addingSet(prevAdding => {
                                                const newAdding = { ...prevAdding }
                                                if (newAdding.departments === undefined) newAdding.departments = false

                                                newAdding.departments = !newAdding.departments
                                                return newAdding
                                            })
                                        }}
                                    >{adding.departments ? "close" : "add department"}</button>

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

                                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                            <Link href={`usersToDepartments/add`} target='_blank'>
                                                                <button className='button1'>add userToDepartment</button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {activeScreen === "companies" && (
                                <>
                                    <button className='button1'
                                        onClick={() => {
                                            addingSet(prevAdding => {
                                                const newAdding = { ...prevAdding }
                                                if (newAdding.companies === undefined) newAdding.companies = false

                                                newAdding.companies = !newAdding.companies
                                                return newAdding
                                            })
                                        }}
                                    >{adding.companies ? "close" : "add company"}</button>

                                    {adding.companies === true && (
                                        <AddEditCompany />
                                    )}

                                    <button className='button3'
                                        onClick={async () => {
                                            try {
                                                toast.success("searching")

                                                companiesSet(await getCompanies({}))

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

                            {activeScreen === "usersToDepartments" && (
                                <>
                                    <button className='button1'
                                        onClick={() => {
                                            addingSet(prevAdding => {
                                                const newAdding = { ...prevAdding }
                                                if (newAdding.usersToDepartments === undefined) newAdding.usersToDepartments = false

                                                newAdding.usersToDepartments = !newAdding.usersToDepartments
                                                return newAdding
                                            })
                                        }}
                                    >{adding.usersToDepartments ? "close" : "add userToDepartment"}</button>

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
                                                                    newEditing.usersToDepartments = newEditing.usersToDepartments === undefined ? { userToDepartmentId: eachUserToDepartment.id } : undefined

                                                                    return newEditing
                                                                })
                                                            }}
                                                        >{editing.usersToDepartments ? "cancel edit" : "edit userToDepartment"}</button>
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
                                                    sentUserDepartment={usersToDepartments.find(eachUserToDepartment => editing.usersToDepartments !== undefined && eachUserToDepartment.id === editing.usersToDepartments.userToDepartmentId)}
                                                    departmentsStarter={departments}
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {activeScreen === "usersToCompanies" && (
                                <>
                                    <button className='button1'
                                        onClick={() => {
                                            addingSet(prevAdding => {
                                                const newAdding = { ...prevAdding }
                                                if (newAdding.usersToCompanies === undefined) newAdding.usersToCompanies = false

                                                newAdding.usersToCompanies = !newAdding.usersToCompanies
                                                return newAdding
                                            })
                                        }}
                                    >{adding.usersToCompanies ? "close" : "add userToCompany"}</button>

                                    {adding.usersToCompanies === true && (
                                        <AddEditUserCompany companiesStarter={companies} />
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
                                                                    newEditing.usersToDepartments = newEditing.usersToDepartments === undefined ? { userToDepartmentId: eachUserToDepartment.id } : undefined

                                                                    return newEditing
                                                                })
                                                            }}
                                                        >{editing.usersToDepartments ? "cancel edit" : "edit userToDepartment"}</button>
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
                                                    sentUserDepartment={usersToDepartments.find(eachUserToDepartment => editing.usersToDepartments !== undefined && eachUserToDepartment.id === editing.usersToDepartments.userToDepartmentId)}
                                                    departmentsStarter={departments}
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

function ChecklistStartersScreen() {
    const [activeChecklistStarterType, activeChecklistStarterTypeSet] = useState<checklistStarter["type"] | undefined>()
    const [checklistStarters, checklistStartersSet] = useState<checklistStarter[] | undefined>()
    const activeChecklistStarter = useMemo<checklistStarter | undefined>(() => {
        if (checklistStarters === undefined || activeChecklistStarterType === undefined) return undefined

        return checklistStarters.find(eachChecklistStarter => eachChecklistStarter.type === activeChecklistStarterType)

    }, [checklistStarters, activeChecklistStarterType])


    useEffect(() => {
        handleGetChecklistStarters()

    }, [])

    async function handleGetChecklistStarters() {
        const results = await getChecklistStarters()
        checklistStartersSet(results)
    }

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <ShowMore
                label='add checklist starter'
                content={
                    <AddEditChecklistStarter
                        submissionAction={handleGetChecklistStarters}
                    />
                }
            />

            {checklistStarters !== undefined && checklistStarters.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                    {checklistStarters.map(eachChecklistStarter => {
                        return (
                            <button key={eachChecklistStarter.type} className='button1' style={{ backgroundColor: eachChecklistStarter.type === activeChecklistStarter?.type ? "rgb(var(--color1))" : "" }}
                                onClick={() => {
                                    activeChecklistStarterTypeSet(eachChecklistStarter.type)
                                }}
                            >{eachChecklistStarter.type}</button>
                        )
                    })}
                </div>
            )}

            {activeChecklistStarter !== undefined && (
                <ShowMore
                    label='edit checklist starter'
                    content={
                        <AddEditChecklistStarter sentChecklistStarter={activeChecklistStarter}
                            submissionAction={handleGetChecklistStarters}
                        />
                    }
                />
            )}
        </div>
    )
}