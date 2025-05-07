"use client"
import { spaceCamelCase, deepClone } from '@/utility/utility'
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '@/components/textInput/TextInput'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'
import { company, equipmentFormNewEquipmentSchema, equipmentFormNewEquipmentType, equipmentFormType, equipmentT, resourceAuthType, searchObj } from '@/types'
import { getEquipment } from '@/serverFunctions/handleEquipment'
import ViewEquipment from '@/components/equipment/ViewEquipment'
import TextArea from '@/components/textArea/TextArea'
import { getEquipmentData } from '@/components/equipment/getEquipmentData'
import ShowMore from '@/components/showMore/ShowMore'
import SearchWithInput from '@/components/tapes/SearchWithInput'

export function EditEquipmentForm({ seenForm, handleFormUpdate, seenCompanyId }: { seenForm: equipmentFormType, handleFormUpdate: (updatedFormData: equipmentFormType) => void, seenCompanyId: company["id"] }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: equipmentFormType = {
        type: seenForm.type,
        data: {
            equipmentInRequest: [],
        }
    }
    const [formObj, formObjSet] = useState<equipmentFormType>(deepClone(seenForm.data !== null ? seenForm : initialFormObj))

    type equipmentFormNewEquipmentKeys = keyof equipmentFormNewEquipmentType
    const [equipmentInRequestErrors, equipmentInRequestErrorsSet] = useState<{ [key: string]: Partial<{ [key in equipmentFormNewEquipmentKeys]: string }> }>({})

    const userInteracting = useRef(false)

    const [equipmentSearchObj, equipmentSearchObjSet] = useState<searchObj<equipmentT>>({
        searchItems: [],
    })

    //handle changes from above
    useEffect(() => {
        if (seenForm.data === null) return

        formObjSet(deepClone(seenForm))

    }, [seenForm])

    //send changes up
    useEffect(() => {
        const formIsValid = Object.entries(equipmentInRequestErrors).length < 1
        console.log(`$equipmentInRequestErrors`, equipmentInRequestErrors);

        if (!userInteracting.current || formObj.data === null || !formIsValid) return

        //reset so no loop
        userInteracting.current = false

        console.log(`$sent up`, formObj);

        //send up the update
        handleFormUpdate(formObj)

    }, [formObj, equipmentInRequestErrors])

    function checkIfEquipmentInRequestValid(seenFormObj: Partial<equipmentFormNewEquipmentType>, seenName: keyof equipmentFormNewEquipmentType, index: number) {
        //@ts-expect-error type
        const testSchema = equipmentFormNewEquipmentSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            equipmentInRequestErrorsSet(prevObj => {
                const newObj = { ...prevObj }

                if (newObj[index] === undefined) {
                    newObj[index] = {}
                }

                delete newObj[index][seenName]

                //delete parent obj
                if (Object.entries(newObj[index]).length === 0) {
                    delete newObj[index]
                }

                return newObj
            })

        } else {
            equipmentInRequestErrorsSet(prevObj => {
                const newObj = { ...prevObj }

                let errorMessage = ""

                JSON.parse(testSchema.error.message).forEach((eachErrorObj: Error) => {
                    errorMessage += ` ${eachErrorObj.message}`
                })

                if (newObj[index] === undefined) {
                    newObj[index] = {}
                }

                newObj[index][seenName] = errorMessage

                return newObj
            })
        }
    }

    function runSameOnAllFormObjUpdates() {
        userInteracting.current = true
    }

    if (formObj.data === null) return null

    return (
        <div className={styles.form}>
            <label>{spaceCamelCase(formObj.type)}</label>

            <ShowMore
                label='search equipment'
                content={
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                        <SearchWithInput
                            searchObj={equipmentSearchObj}
                            searchObjSet={equipmentSearchObjSet}
                            allSearchFunc={async () => {
                                if (resourceAuth === undefined) throw new Error("no auth seen")

                                return await getEquipment({ companyId: seenCompanyId }, resourceAuth, equipmentSearchObj.limit, equipmentSearchObj.offset)
                            }}
                            specificSearchFunc={async seenText => {
                                if (resourceAuth === undefined) throw new Error("no auth seen")

                                return await getEquipment({ companyId: seenCompanyId, makeModel: seenText }, resourceAuth, equipmentSearchObj.limit, equipmentSearchObj.offset)
                            }}
                            label={<h3>filter by media label</h3>}
                            placeHolder={"enter equipment model"}
                        />

                        {equipmentSearchObj.searchItems.length > 0 && (
                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto", gridTemplateRows: "350px" }} className='snap'>
                                {equipmentSearchObj.searchItems.map((eachEquipment, eachEquipmentIndex) => {
                                    return (
                                        <ViewEquipment key={eachEquipmentIndex} seenEquipment={eachEquipment}
                                            addFunction={() => {
                                                runSameOnAllFormObjUpdates()

                                                formObjSet(prevFormObj => {
                                                    const newFormObj = { ...prevFormObj }
                                                    if (newFormObj.data === null) return prevFormObj

                                                    //refresh
                                                    newFormObj.data = { ...newFormObj.data }

                                                    //if id check if in array already - update that record
                                                    const foundInEquipmentArr = newFormObj.data.equipmentInRequest.find(eachTapeFind => eachTapeFind.id === eachEquipment.id) !== undefined

                                                    if (foundInEquipmentArr) {
                                                        newFormObj.data.equipmentInRequest = newFormObj.data.equipmentInRequest.map(eachTapeInRequestMap => {
                                                            if (eachTapeInRequestMap.id === eachEquipment.id) {
                                                                return eachEquipment
                                                            }

                                                            return eachTapeInRequestMap
                                                        })

                                                    } else {
                                                        newFormObj.data.equipmentInRequest = [...newFormObj.data.equipmentInRequest, eachEquipment]
                                                    }

                                                    return newFormObj
                                                })

                                                toast.success(`added ${eachEquipment.makeModel}`)
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </div>
                }
            />

            {formObj.data.equipmentInRequest.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 500px)", overflow: "auto", maxHeight: "60vh" }} className='snap'>
                        {formObj.data.equipmentInRequest.map((eachEquipment, eachEquipmentIndex) => {
                            return (
                                <div key={eachEquipmentIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", position: "relative" }}>
                                    <ConfirmationBox
                                        text={""}
                                        confirmationText='are you sure you want to remove?'
                                        successMessage='removed!'
                                        float={true}
                                        confirmationDivProps={{
                                            style: {
                                                position: "absolute"
                                            }
                                        }}
                                        buttonProps={{
                                            className: "button2",
                                            style: {
                                                justifySelf: "flex-end"
                                            }
                                        }}
                                        icon={
                                            <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"> <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                                        }
                                        runAction={() => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.equipmentInRequest = newFormObj.data.equipmentInRequest.filter((eachEquipmentFilter, eachEquipmentFilterIndex) => eachEquipmentFilterIndex !== eachEquipmentIndex)

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/makeModel`}
                                        value={eachEquipment.makeModel}
                                        type={"text"}
                                        label={"make / model"}
                                        placeHolder={"enter the equipment make / model"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].makeModel = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "makeModel", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["makeModel"]}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/quantity`}
                                        value={`${eachEquipment.quantity}`}
                                        type={"number"}
                                        label={"quantity"}
                                        placeHolder={"enter the equipment quantity"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                let seenNum = parseInt(e.target.value)
                                                if (isNaN(seenNum)) {
                                                    seenNum = 0
                                                }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].quantity = seenNum

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "quantity", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["quantity"]}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/powerSupplyCount`}
                                        value={`${eachEquipment.powerSupplyCount}`}
                                        type={"number"}
                                        label={"powerSupplyCount"}
                                        placeHolder={"enter the power supply count"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                let seenNum = parseInt(e.target.value)
                                                if (isNaN(seenNum)) {
                                                    seenNum = 0
                                                }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].powerSupplyCount = seenNum

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "powerSupplyCount", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["powerSupplyCount"]}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/rackUnits`}
                                        value={`${eachEquipment.rackUnits}`}
                                        type={"number"}
                                        label={"rackUnits"}
                                        placeHolder={"enter the rackUnits"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                let seenNum = parseInt(e.target.value)
                                                if (isNaN(seenNum)) {
                                                    seenNum = 0
                                                }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].rackUnits = seenNum

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "rackUnits", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["rackUnits"]}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/serialNumber`}
                                        value={eachEquipment.serialNumber}
                                        type={"text"}
                                        label={"serial number"}
                                        placeHolder={"enter the equipment serial number"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].serialNumber = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "serialNumber", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["serialNumber"]}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/amps`}
                                        value={eachEquipment.amps !== null ? eachEquipment.amps : ""}
                                        type={"text"}
                                        label={"amps"}
                                        placeHolder={"enter the equipment amps"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].amps = e.target.value

                                                if (e.target.value === "") {
                                                    newFormObj.data.equipmentInRequest[eachEquipmentIndex].amps = null
                                                }

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "amps", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["amps"]}
                                    />

                                    <TextInput
                                        name={`${eachEquipmentIndex}/weight`}
                                        value={eachEquipment.weight !== null ? eachEquipment.weight : ""}
                                        type={"text"}
                                        label={"weight"}
                                        placeHolder={"enter the equipment weight"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].weight = e.target.value

                                                if (e.target.value === "") {
                                                    newFormObj.data.equipmentInRequest[eachEquipmentIndex].weight = null
                                                }

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "weight", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["weight"]}
                                    />

                                    <TextArea
                                        name={`${eachEquipmentIndex}/additionalNotes`}
                                        value={eachEquipment.additionalNotes}
                                        label={"additional notes"}
                                        placeHolder={"enter any additional notes"}
                                        onChange={(e) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.equipmentInRequest[eachEquipmentIndex].additionalNotes = (e as React.ChangeEvent<HTMLTextAreaElement>).target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfEquipmentInRequestValid(eachEquipment, "additionalNotes", eachEquipmentIndex) }}
                                        errors={equipmentInRequestErrors[eachEquipmentIndex]?.["additionalNotes"]}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            <button className='button1' role='button'
                onClick={() => {
                    runSameOnAllFormObjUpdates()

                    formObjSet(prevFormObj => {
                        const newFormObj = { ...prevFormObj }
                        if (newFormObj.data === null) return prevFormObj

                        //refresh
                        newFormObj.data = { ...newFormObj.data }

                        const newEquipment: equipmentFormNewEquipmentType = getEquipmentData(seenCompanyId, newFormObj.type === "equipmentDeposit")

                        newFormObj.data.equipmentInRequest = [...newFormObj.data.equipmentInRequest, newEquipment]
                        return newFormObj
                    })
                }}
            >add equipment</button>
        </div>
    )
}

export function ViewEquipmentForm({ seenForm }: { seenForm: equipmentFormType }) {
    if (seenForm.data === null) return null

    return (
        <div className={styles.form}>
            <label>{spaceCamelCase(seenForm.type)} equipment</label>

            {seenForm.data.equipmentInRequest.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 300px)", overflow: "auto" }} className='snap'>
                        {seenForm.data.equipmentInRequest.map((eachEquipmentInRequest, eachEquipmentInRequestIndex) => {
                            return (
                                <ViewEquipment key={eachEquipmentInRequestIndex} seenEquipment={eachEquipmentInRequest} />
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}