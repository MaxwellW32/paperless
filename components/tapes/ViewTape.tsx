import { tape } from '@/types'
import React from 'react'
import Moment from 'react-moment'

export default function ViewTape({ seenTape, addFunction }: { seenTape: Partial<tape>, addFunction?: () => void }) {
    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", backgroundColor: "var(--color3)", padding: "var(--spacingR)", gridTemplateRows: "1fr auto", overflow: "auto", borderRadius: "1rem" }}>
            <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", overflow: "auto" }}>
                {seenTape.mediaLabel !== undefined && (
                    <>
                        <label>media label</label>

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

                        <button className='tag'>{seenTape.tapeLocation}</button>
                    </>
                )}

                {seenTape.dateAdded !== undefined && (
                    <>
                        <label>tape added</label>

                        <p><Moment utc-5="true" format="MMM D, YYYY, h:mm A">
                            {seenTape.dateAdded}
                        </Moment></p>
                    </>
                )}
            </div>


            {addFunction !== undefined && (
                <button className='button1'
                    onClick={addFunction}
                >select</button>
            )}
        </div>
    )
}
