"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import TextInput from '../textInput/TextInput'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'
import { company, equipmentSchema, equipmentT, newEquipmentSchema, newEquipmentT, resourceAuthType, updateEquipmentSchema } from '@/types'
import { addEquipment, updateEquipment } from '@/serverFunctions/handleEquipment'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import TextArea from '../textArea/TextArea'

export default function AddEditEquipment({ sentEquipment, submissionAction }: { sentEquipment?: equipmentT, submissionAction?: () => void }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: newEquipmentT = {
        companyId: "",
        quantity: 0,
        makeModel: "",
        serialNumber: "",
        additionalNotes: "",
        powerSupplyCount: 0,
        rackUnits: 0,
        equipmentLocation: "off-site",
        amps: null,
        weight: null,
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<equipmentT>>(deepClone(sentEquipment === undefined ? initialFormObj : updateEquipmentSchema.parse(sentEquipment)))

    type equipmentKeys = keyof Partial<equipmentT>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in equipmentKeys]: string }>>({})

    const [companies, companiesSet] = useState<company[]>([])

    //handle changes from above
    useEffect(() => {
        if (sentEquipment === undefined) return

        formObjSet(deepClone(updateEquipmentSchema.parse(sentEquipment)))

    }, [sentEquipment])

    function checkIfValid(seenFormObj: Partial<equipmentT>, seenName: keyof Partial<equipmentT>, schema: typeof equipmentSchema) {
        // @ts-expect-error type
        const testSchema = schema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }
                delete newObj[seenName]

                return newObj
            })

        } else {
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }

                let errorMessage = ""

                JSON.parse(testSchema.error.message).forEach((eachErrorObj: Error) => {
                    errorMessage += ` ${eachErrorObj.message}`
                })

                newObj[seenName] = errorMessage

                return newObj
            })
        }
    }

    async function handleSubmit() {
        try {
            if (resourceAuth === undefined) throw new Error("not seeing auth")

            toast.success("submittting")

            //new department
            if (sentEquipment === undefined) {
                const validatedNewEquipment = newEquipmentSchema.parse(formObj)

                //send up to server
                await addEquipment(validatedNewEquipment, resourceAuth)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedTape = updateEquipmentSchema.parse(formObj)

                //update
                await updateEquipment(sentEquipment.id, validatedUpdatedTape, resourceAuth)

                toast.success("equipment updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            <label>company for equipment</label>

            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                <button className='button1'
                    onClick={async () => {
                        try {
                            if (resourceAuth === undefined) throw new Error("not seeing auth")

                            toast.success("searching")

                            companiesSet(await getCompanies(resourceAuth))

                        } catch (error) {
                            consoleAndToastError(error)
                        }
                    }}
                >get companies</button>

                <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "250px", overflow: "auto" }} className='snap'>
                    {companies.map(eachCompany => {
                        return (
                            <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: eachCompany.id === formObj.companyId ? "rgb(var(--color3))" : "rgb(var(--color2))", padding: "1rem" }}>
                                <h3>{eachCompany.name}</h3>

                                <button className='button3'
                                    onClick={() => {
                                        toast.success(`${eachCompany.name} selected`)

                                        formObjSet((prevFormObj) => {
                                            const newFormObj = { ...prevFormObj }

                                            newFormObj.companyId = eachCompany.id

                                            return newFormObj
                                        })
                                    }}
                                >select</button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {formObj.makeModel !== undefined && (
                <>
                    <TextInput
                        name={"makeModel"}
                        value={formObj.makeModel}
                        type={"text"}
                        label={"media label"}
                        placeHolder={"enter the equipment make / model"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.makeModel === undefined) return prevFormObj

                                newFormObj.makeModel = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "makeModel", equipmentSchema) }}
                        errors={formErrors["makeModel"]}
                    />
                </>
            )}

            {formObj.quantity !== undefined && (
                <>
                    <TextInput
                        name={"quantity"}
                        value={`${formObj.quantity}`}
                        type={"number"}
                        label={"quantity"}
                        placeHolder={"enter the equipment quantity"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.quantity === undefined) return prevFormObj

                                let seenNum = parseInt(e.target.value)
                                if (isNaN(seenNum)) {
                                    seenNum = 0
                                }

                                newFormObj.quantity = seenNum

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "quantity", equipmentSchema) }}
                        errors={formErrors["quantity"]}
                    />
                </>
            )}

            {formObj.powerSupplyCount !== undefined && (
                <>
                    <TextInput
                        name={"powerSupplyCount"}
                        value={`${formObj.powerSupplyCount}`}
                        type={"number"}
                        label={"powerSupplyCount"}
                        placeHolder={"enter the power supply count"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.powerSupplyCount === undefined) return prevFormObj

                                let seenNum = parseInt(e.target.value)
                                if (isNaN(seenNum)) {
                                    seenNum = 0
                                }

                                newFormObj.powerSupplyCount = seenNum

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "powerSupplyCount", equipmentSchema) }}
                        errors={formErrors["powerSupplyCount"]}
                    />
                </>
            )}

            {formObj.rackUnits !== undefined && (
                <>
                    <TextInput
                        name={"rackUnits"}
                        value={`${formObj.rackUnits}`}
                        type={"number"}
                        label={"rackUnits"}
                        placeHolder={"enter the rackUnits"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.rackUnits === undefined) return prevFormObj

                                let seenNum = parseInt(e.target.value)
                                if (isNaN(seenNum)) {
                                    seenNum = 0
                                }

                                newFormObj.rackUnits = seenNum

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "rackUnits", equipmentSchema) }}
                        errors={formErrors["rackUnits"]}
                    />
                </>
            )}

            {formObj.serialNumber !== undefined && (
                <>
                    <TextInput
                        name={"serialNumber"}
                        value={formObj.serialNumber}
                        type={"text"}
                        label={"serial number"}
                        placeHolder={"enter the equipment serial number"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.serialNumber === undefined) return prevFormObj

                                newFormObj.serialNumber = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "serialNumber", equipmentSchema) }}
                        errors={formErrors["serialNumber"]}
                    />
                </>
            )}

            {formObj.amps !== undefined && (
                <>
                    <TextInput
                        name={"amps"}
                        value={formObj.amps !== null ? formObj.amps : ""}
                        type={"text"}
                        label={"amps"}
                        placeHolder={"enter the equipment amps"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.amps === undefined) return prevFormObj

                                newFormObj.amps = e.target.value

                                if (e.target.value === "") {
                                    newFormObj.amps = null
                                }

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "amps", equipmentSchema) }}
                        errors={formErrors["amps"]}
                    />
                </>
            )}

            {formObj.weight !== undefined && (
                <>
                    <TextInput
                        name={"weight"}
                        value={formObj.weight !== null ? formObj.weight : ""}
                        type={"text"}
                        label={"weight"}
                        placeHolder={"enter the equipment weight"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.weight === undefined) return prevFormObj

                                newFormObj.weight = e.target.value

                                if (e.target.value === "") {
                                    newFormObj.weight = null
                                }

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "weight", equipmentSchema) }}
                        errors={formErrors["weight"]}
                    />
                </>
            )}

            {formObj.additionalNotes !== undefined && (
                <>
                    <TextArea
                        name={`additionalNotes`}
                        value={formObj.additionalNotes}
                        label={"additional notes"}
                        placeHolder={"enter any additional notes"}
                        onChange={(e) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.additionalNotes === undefined) return prevFormObj

                                newFormObj.additionalNotes = (e as React.ChangeEvent<HTMLTextAreaElement>).target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "additionalNotes", equipmentSchema) }}
                        errors={formErrors["additionalNotes"]}
                    />
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentEquipment !== undefined ? "update" : "submit"}</button>
        </form>
    )
}