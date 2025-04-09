import { tape } from '@/types'
import React from 'react'
import Moment from 'react-moment'

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
                    <>
                        <Moment utc format="MMM D, YYYY, h:mm A">
                            {seenTape.dateAdded}
                        </Moment>
                    </>
                </>
            )}
        </div>
    )
}
