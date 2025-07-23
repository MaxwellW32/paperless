import { equipmentT } from '@/types'
import React from 'react'
import Moment from 'react-moment'

export default function ViewEquipment({ seenEquipment, addFunction }: { seenEquipment: Partial<equipmentT>, addFunction?: () => void }) {
    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", backgroundColor: "var(--color3)", padding: "var(--spacingR)", gridTemplateRows: "1fr auto", overflow: "auto", borderRadius: "1rem" }}>
            <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", overflow: "auto" }}>
                {seenEquipment.makeModel !== undefined && (
                    <>
                        <label>make / model</label>

                        <p>{seenEquipment.makeModel}</p>
                    </>
                )}

                {seenEquipment.serialNumber !== undefined && (
                    <>
                        <label>serialNumber</label>

                        <p>{seenEquipment.serialNumber}</p>
                    </>
                )}

                {seenEquipment.quantity !== undefined && (
                    <>
                        <label>quantity</label>

                        <p>{seenEquipment.quantity}</p>
                    </>
                )}

                {seenEquipment.powerSupplyCount !== undefined && (
                    <>
                        <label>power supply count</label>

                        <p>{seenEquipment.powerSupplyCount}</p>
                    </>
                )}

                {seenEquipment.rackUnits !== undefined && (
                    <>
                        <label>rack Units</label>

                        <p>{seenEquipment.rackUnits}</p>
                    </>
                )}

                {seenEquipment.equipmentLocation !== undefined && (
                    <>
                        <label>equipment location</label>

                        <p>{seenEquipment.equipmentLocation}</p>
                    </>
                )}

                {seenEquipment.amps !== undefined && seenEquipment.amps !== null && (
                    <>
                        <label>amps</label>

                        <p>{seenEquipment.amps}</p>
                    </>
                )}

                {seenEquipment.weight !== undefined && seenEquipment.weight !== null && (
                    <>
                        <label>weight</label>

                        <p>{seenEquipment.weight}</p>
                    </>
                )}

                {seenEquipment.dateAdded !== undefined && (
                    <>
                        <label>tape added</label>

                        <p><Moment utc-5="true" format="MMM D, YYYY, h:mm A">
                            {seenEquipment.dateAdded}
                        </Moment></p>
                    </>
                )}

                {seenEquipment.additionalNotes !== undefined && (
                    <>
                        <label>additionalNotes</label>

                        <p>{seenEquipment.additionalNotes}</p>
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
