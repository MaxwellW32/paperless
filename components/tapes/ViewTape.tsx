import { tape } from '@/types'
import { formatLocalDateTime } from '@/utility/utility'
import React from 'react'

export default function ViewTape({ seenTape, addFunction }: { seenTape: Partial<tape>, addFunction?: () => void }) {
    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
            {seenTape.mediaLabel !== undefined && (
                <>
                    <label>media label:</label>

                    <p>{seenTape.mediaLabel}</p>
                </>
            )}

            {seenTape.initial !== undefined && (
                <>
                    <label>initial</label>

                    <p>{seenTape.initial}</p>
                </>
            )}

            {seenTape.tapeLocation !== undefined && (
                <>
                    <label>tape location</label>

                    <label>{seenTape.tapeLocation}</label>
                </>
            )}


            {addFunction !== undefined && (
                <button className='button1'
                    onClick={addFunction}
                >add</button>
            )}

            {seenTape.dateAdded !== undefined && (
                <>
                    <p>{formatLocalDateTime(seenTape.dateAdded)}</p>
                </>
            )}
        </div>
    )
}
