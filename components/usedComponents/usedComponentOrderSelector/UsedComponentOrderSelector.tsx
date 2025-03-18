import { changeUsedComponentIndex } from '@/serverFunctions/handleUsedComponents'
import { refreshWebsitePath } from '@/serverFunctions/handleWebsites'
import { usedComponent, website } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { getUsedComponentsInSameLocation, sanitizeUsedComponentData } from '@/utility/utility'
import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export default function UsedComponentOrderSelector({ websiteId, seenUsedComponents, seenUsedComponent }: { websiteId: website["id"], seenUsedComponents: usedComponent[], seenUsedComponent: usedComponent }) {
    const [inputValue, inputValueSet] = useState("")
    const [wantedIndex, wantedIndexSet] = useState<number | null>(null)

    const usedComponentsInSameLocation = useMemo<usedComponent[]>(() => {
        //match other usedComponents in same location
        const usedComponentsInSameLocation = getUsedComponentsInSameLocation(seenUsedComponent.location, seenUsedComponents)

        return usedComponentsInSameLocation
    }, [seenUsedComponent, seenUsedComponents])

    const indexInArray = useMemo<number | undefined>(() => {
        const seenIndex = usedComponentsInSameLocation.findIndex(eachUsedComponentsInSameLocation => eachUsedComponentsInSameLocation.id === seenUsedComponent.id)
        if (seenIndex < 0) return undefined

        return seenIndex

    }, [seenUsedComponent, usedComponentsInSameLocation])

    return (
        <div style={{ display: "grid", alignContent: "flex-start" }}>
            {indexInArray !== undefined && (
                <p>current position: {indexInArray + 1}</p>
            )}

            <p>max position: {usedComponentsInSameLocation.length - 1 + 1}</p>

            <input type='text' value={inputValue} placeholder='Enter new position'
                onChange={(e) => {
                    inputValueSet(e.target.value)
                }}

                onBlur={() => {
                    let seenNumber = parseInt(inputValue)
                    //add +1 for the number/index difference
                    if (isNaN(seenNumber)) seenNumber = 0 + 1

                    if (seenNumber < 0 + 1) {
                        seenNumber = 0 + 1
                    }

                    if (seenNumber > usedComponentsInSameLocation.length - 1 + 1) {
                        seenNumber = usedComponentsInSameLocation.length - 1 + 1
                    }

                    //returns number position instead of index
                    wantedIndexSet(seenNumber)
                    inputValueSet(`${seenNumber}`)
                }}
            />

            <button className='mainButton'
                onClick={async () => {
                    try {
                        if (wantedIndex === null) throw new Error("prove the new position")

                        const sanitizedUsedComponent = sanitizeUsedComponentData(seenUsedComponent)

                        //change index position
                        await changeUsedComponentIndex(sanitizedUsedComponent, wantedIndex - 1)

                        refreshWebsitePath({ id: websiteId })

                        toast.success("order changed")

                    } catch (error) {
                        consoleAndToastError(error)
                    }
                }}
            >change</button>
        </div>
    )
}
