"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import TextInput from '../textInput/TextInput'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'
import { company, newTape, newTapeSchema, resourceAuthType, tape, tapeLocation, tapeSchema, updateTapeSchema } from '@/types'
import { addTapes, updateTapes } from '@/serverFunctions/handleTapes'
import { getCompanies } from '@/serverFunctions/handleCompanies'

export default function AddEditTape({ sentTape, submissionAction }: { sentTape?: tape, submissionAction?: () => void }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: newTape = {
        mediaLabel: "",
        initial: "",
        companyId: "",
        tapeLocation: "with-client"
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<tape>>(deepClone(sentTape === undefined ? initialFormObj : updateTapeSchema.parse(sentTape)))

    type tapeKeys = keyof Partial<tape>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in tapeKeys]: string }>>({})

    const tapeLocationOptions: tapeLocation[] = ["in-vault", "with-client"]
    const [companies, companiesSet] = useState<company[]>([])

    //handle changes from above
    useEffect(() => {
        if (sentTape === undefined) return

        formObjSet(deepClone(updateTapeSchema.parse(sentTape)))

    }, [sentTape])

    function checkIfValid(seenFormObj: Partial<tape>, seenName: keyof Partial<tape>, schema: typeof tapeSchema) {
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
            if (sentTape === undefined) {
                const validatedNewTape = newTapeSchema.parse(formObj)

                //send up to server
                await addTapes(validatedNewTape, resourceAuth)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedTape = updateTapeSchema.parse(formObj)

                //update
                await updateTapes(sentTape.id, validatedUpdatedTape, resourceAuth)

                toast.success("tape updated")
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
            <label>company for tape</label>

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

            {formObj.mediaLabel !== undefined && (
                <>
                    <TextInput
                        name={"mediaLabel"}
                        value={formObj.mediaLabel}
                        type={"text"}
                        label={"tape media label"}
                        placeHolder={"enter tape media label"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.mediaLabel === undefined) return prevFormObj

                                newFormObj.mediaLabel = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "mediaLabel", tapeSchema) }}
                        errors={formErrors["mediaLabel"]}
                    />
                </>
            )}

            {formObj.initial !== undefined && (
                <>
                    <TextInput
                        name={"initial"}
                        value={formObj.initial}
                        type={"text"}
                        label={"tape media initial"}
                        placeHolder={"enter tape media initial"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.initial === undefined) return prevFormObj

                                newFormObj.initial = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "initial", tapeSchema) }}
                        errors={formErrors["initial"]}
                    />
                </>
            )}

            {formObj.mediaLabel !== undefined && (
                <>
                    <TextInput
                        name={"mediaLabel"}
                        value={formObj.mediaLabel}
                        type={"text"}
                        label={"tape media label"}
                        placeHolder={"enter tape media label"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.mediaLabel === undefined) return prevFormObj

                                newFormObj.mediaLabel = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "mediaLabel", tapeSchema) }}
                        errors={formErrors["mediaLabel"]}
                    />
                </>
            )}

            {formObj.tapeLocation !== undefined && (
                <>
                    <label>select tape location</label>

                    <select value={formObj.tapeLocation}
                        onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                            const eachTapeLocation = event.target.value as tapeLocation

                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.tapeLocation === undefined) return prevFormObj

                                newFormObj.tapeLocation = eachTapeLocation

                                return newFormObj
                            })
                        }}
                    >
                        {tapeLocationOptions.map(eachTapeLocation => {

                            return (
                                <option key={eachTapeLocation} value={eachTapeLocation}
                                >{eachTapeLocation}</option>
                            )
                        })}
                    </select>
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentTape !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































