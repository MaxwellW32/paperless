import { tapeDepositFormSchema, tapeDepositFormType, tapeDepositFormNonNullDataType } from '@/types'
import { deepClone } from '@/utility/utility'
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '@/components/textInput/TextInput'
import { z } from "zod"

//on deposit search tapes from db
//if client chooses a tape set it - id will be there
//when wrapping up request add tapes in list to db - update tapes with id

export function EditTapeDeposit({ seenForm, handleFormUpdate }: { seenForm: tapeDepositFormType["data"], handleFormUpdate: (updatedFormData: tapeDepositFormNonNullDataType) => void }) {
    const initialFormObj: tapeDepositFormNonNullDataType = {
        newTapes: [],
        eta: ""
    }
    const [formObj, formObjSet] = useState<tapeDepositFormType["data"]>(deepClone(seenForm !== null ? seenForm : initialFormObj))

    type tapeDepositFormTypeNonNullKeys = keyof tapeDepositFormNonNullDataType
    const [formErrors, formErrorsSet] = useState<Partial<{ [key: string]: string }>>({})

    const userInteracting = useRef(false)

    //handle changes from above
    useEffect(() => {
        if (seenForm === null) return

        formObjSet(deepClone(seenForm))

    }, [seenForm])

    //send changes up
    useEffect(() => {
        if (!userInteracting.current) return
        userInteracting.current = false

        const isValid = Object.entries(formErrors).length < 1
        if (!isValid) return

        if (formObj === null) return
        handleFormUpdate(formObj)

    }, [formObj])

    function checkIfValid(seenFormObj: tapeDepositFormNonNullDataType): boolean {
        const testSchema = tapeDepositFormSchema.shape.data.safeParse(seenFormObj);

        if (testSchema.error === undefined) return true

        formErrorsSet(prevFormErrors => {
            const newFormErrors = { ...prevFormErrors }

            testSchema.error.errors.forEach(eachError => {
                const errorKey = eachError.path.join('/')
                console.log(`errorKey${errorKey}`)
                newFormErrors[errorKey] = eachError.message
            })

            return newFormErrors
        })

        return false
    }

    function runSameOnAll() {
        userInteracting.current = true
    }

    if (formObj === null) return null

    return (
        <div className={styles.form}>
            <TextInput
                name={`eta`}
                value={formObj.eta}
                type={"datetime-local"}
                label={"expected arrival"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    runSameOnAll()

                    formObjSet(prevFormObj => {
                        if (prevFormObj === null) return prevFormObj
                        const newFormObj = { ...prevFormObj }

                        newFormObj.eta = e.target.value

                        return newFormObj
                    })
                }}
                onBlur={() => { checkIfValid(formObj) }}
                errors={formErrors["eta"]}
            />

            <label>tapes</label>

            <button className='button1' role='button'
                onClick={() => {
                    runSameOnAll()

                    formObjSet(prevFormObj => {
                        if (prevFormObj === null) return prevFormObj
                        const newFormObj = { ...prevFormObj }

                        const newTape: tapeDepositFormNonNullDataType["newTapes"][number] = {
                            initial: "",
                            mediaLabel: ""
                        }

                        newFormObj.newTapes = [...newFormObj.newTapes, newTape]

                        return newFormObj
                    })
                }}
            >add tape</button>

            {formObj.newTapes.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                        {formObj.newTapes.map((eachNewTape, eachNewTapeIndex) => {
                            return (
                                <div key={eachNewTapeIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                    <TextInput
                                        name={`mediaLabel/${eachNewTapeIndex}`}
                                        value={eachNewTape.mediaLabel}
                                        type={"text"}
                                        label={"media label"}
                                        placeHolder={"enter the tape media label"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAll()

                                            formObjSet(prevFormObj => {
                                                if (prevFormObj === null) return prevFormObj
                                                const newFormObj = { ...prevFormObj }

                                                newFormObj.newTapes[eachNewTapeIndex].mediaLabel = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfValid(formObj) }}
                                        errors={formErrors[`newTapes/${eachNewTapeIndex}/mediaLabel`]}
                                    />

                                    <TextInput
                                        name={`initial/${eachNewTapeIndex}`}
                                        value={eachNewTape.initial}
                                        type={"text"}
                                        label={"initial"}
                                        placeHolder={"enter the tape initial"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAll()

                                            formObjSet(prevFormObj => {
                                                if (prevFormObj === null) return prevFormObj
                                                const newFormObj = { ...prevFormObj }

                                                newFormObj.newTapes[eachNewTapeIndex].initial = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfValid(formObj) }}
                                        errors={formErrors[`newTapes/${eachNewTapeIndex}/initial`]}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
