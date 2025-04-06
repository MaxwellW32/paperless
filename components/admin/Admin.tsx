"use client"
import { getChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { checklistStarter, department } from '@/types'
import React, { useEffect, useMemo, useState } from 'react'
import ShowMore from '../showMore/ShowMore'
import AddEditChecklistStarter from '../checklistStarters/AddEditChecklistStarter'
import { getDepartments } from '@/serverFunctions/handleDepartments'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function Admin() {
    type screenSelectionType = {
        screen: "checklistStarters"
    } | {
        screen: "departments"
    }
    const screenOptions: (screenSelectionType["screen"])[] = ["checklistStarters", "departments"]
    const [screenSelection, screenSelectionSet] = useState<screenSelectionType | undefined>(undefined)
    const [departments, departmentsSet] = useState<department[]>([])

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", overflow: "auto", padding: "1rem" }}>
            <h3>admin Page</h3>

            <div>
                <h3>Choose a screen</h3>

                <select value={screenSelection !== undefined ? screenSelection.screen : ""}
                    onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                        if (event.target.value === "") return

                        const eachStarterType = event.target.value as screenSelectionType["screen"]

                        screenSelectionSet({
                            screen: eachStarterType
                        })
                    }}
                >
                    <option value={''}
                    >select a screen</option>

                    {screenOptions.map(eachScreenOption => {

                        return (
                            <option key={eachScreenOption} value={eachScreenOption}
                            >{eachScreenOption}</option>
                        )
                    })}
                </select>
            </div>

            {screenSelection !== undefined && (
                <>
                    {screenSelection.screen === "checklistStarters" && (
                        <>
                            <ShowMore
                                label='checklist starters'
                                content={
                                    <ChecklistStartersScreen />
                                }
                            />
                        </>
                    )}

                    {screenSelection.screen === "departments" && (
                        <>
                            <button className='button1'
                                onClick={async () => {
                                    toast.success("searching")

                                    departmentsSet(await getDepartments({ departmentIdBeingAccessed: "" }))
                                }}
                            >get departments</button>

                            <Link href={`departments/add`} target='_blank'>
                                <button className='button1'>add department</button>
                            </Link>

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
                </>
            )}
        </div>
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