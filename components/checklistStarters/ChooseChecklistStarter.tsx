"use client"
import React, { useEffect, useState } from 'react'
import AddEditClientRequest from '../clientRequests/AddEditClientRequest'
import { checklistStarter, department } from '@/types'
import { getSpecificChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'

export default function ChooseChecklistStarter({ seenChecklistStarterType, seenDepartment }: { seenChecklistStarterType: checklistStarter["type"], seenDepartment?: department }) {
    const [chosenChecklistStarter, chosenChecklistStarterSet] = useState<checklistStarter | undefined>()

    //set the chosen checklist
    useEffect(() => {
        try {
            const search = async () => {
                //reset
                chosenChecklistStarterSet(undefined)

                const seenChecklistStarter = await getSpecificChecklistStarters(seenChecklistStarterType)
                if (seenChecklistStarter === undefined) throw new Error("not seeing checklist")

                chosenChecklistStarterSet(seenChecklistStarter)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }

    }, [seenChecklistStarterType])

    if (chosenChecklistStarter === undefined) return null

    return (
        <AddEditClientRequest checklistStarter={chosenChecklistStarter} department={seenDepartment} />
    )
}
