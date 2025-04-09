import { tapeDepositFormType } from '@/types'
import { formatLocalDateTime } from '@/utility/utility'
import React from 'react'
import styles from "./style.module.css"
import ViewTape from '@/components/tapes/ViewTape'

export function ViewTapeDeposit({ seenFormData }: { seenFormData: tapeDepositFormType["data"] }) {
    if (seenFormData === null) return null

    return (
        <div className={styles.form}>
            <label>tapes</label>

            {seenFormData.newTapes.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 400px)", overflow: "auto" }} className='snap'>
                        {seenFormData.newTapes.map((eachNewTape, eachNewTapeIndex) => {
                            return (
                                <ViewTape key={eachNewTapeIndex} seenTape={eachNewTape} />
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
