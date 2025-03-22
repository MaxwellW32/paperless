"use client"
import { getChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { checklistStarter } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import ShowMore from '../showMore/ShowMore'
import AddEditChecklistStarter from '../checklistStarters/AddEditChecklistStarter'

export default function Admin() {
    const [screenSelection, screenSelectionSet] = useState<"checklistStarters">("checklistStarters")

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <ShowMore
                label='checklist starters'
                content={
                    <ChecklistStarters />
                }
            />
        </div>
    )
}


function ChecklistStarters() {
    const [activeChecklistStarterType, activeChecklistStarterTypeSet] = useState<checklistStarter["type"] | undefined>()
    const [checklistStarters, checklistStartersSet] = useState<checklistStarter[] | undefined>()
    const activeChecklistStarter = useMemo<checklistStarter | undefined>(() => {
        if (checklistStarters === undefined || activeChecklistStarterType === undefined) return undefined

        return checklistStarters.find(eachChecklistStarter => eachChecklistStarter.type === activeChecklistStarterType)

    }, [checklistStarters, activeChecklistStarterType])


    useEffect(() => {
        const search = async () => {
            const results = await getChecklistStarters()
            checklistStartersSet(results)
        }
        search()
    }, [])


    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <h3>All checklist starters</h3>

            <ShowMore
                label='add checklist starter'
                content={
                    <AddEditChecklistStarter />
                }
            />

            {checklistStarters !== undefined && checklistStarters.length > 0 && (
                <>
                    <h3>select one</h3>

                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {checklistStarters.map(eachChecklistStarter => {
                            return (
                                <button key={eachChecklistStarter.type} style={{ backgroundColor: eachChecklistStarter.type === activeChecklistStarter?.type ? "rgb(var(--color1))" : "" }}
                                    onClick={() => {
                                        activeChecklistStarterTypeSet(eachChecklistStarter.type)
                                    }}
                                >{eachChecklistStarter.type}</button>
                            )
                        })}
                    </div>
                </>
            )}

            {activeChecklistStarter !== undefined && (
                <ShowMore
                    label='edit checklist starter'
                    content={
                        <AddEditChecklistStarter sentChecklistStarter={activeChecklistStarter} />
                    }
                />
            )}
        </div>
    )
}