import { tapeDepositFormSchema, tapeDepositFormType, tapeDepositFormNonNullDataType } from '@/types'
import { deepClone } from '@/utility/utility'
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '@/components/textInput/TextInput'
import { z } from "zod"
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'

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
        if (!userInteracting.current || formObj === null) return

        const formIsValid = Object.entries(formErrors).length < 1
        if (!formIsValid) return

        //send the update
        handleFormUpdate(formObj)

        userInteracting.current = false

    }, [formObj])

    function checkIfValid(seenFormObj: tapeDepositFormNonNullDataType): boolean {
        const testSchema = tapeDepositFormSchema.shape.data.safeParse(seenFormObj);
        formErrorsSet({})

        if (testSchema.error === undefined) return true

        formErrorsSet(prevFormErrors => {
            const newFormErrors = { ...prevFormErrors }

            testSchema.error.errors.forEach(eachError => {
                const errorKey = eachError.path.join('/')
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
                                <div key={eachNewTapeIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", position: "relative" }}>
                                    <ConfirmationBox
                                        text={"remove"}
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
                                            formObjSet(prevFormObj => {
                                                if (prevFormObj === null) return prevFormObj
                                                const newFormObj = { ...prevFormObj }

                                                newFormObj.newTapes = newFormObj.newTapes.filter((eachNewTapeFilter, eachNewTapeFilterIndex) => eachNewTapeFilterIndex !== eachNewTapeIndex)

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <TextInput
                                        name={`${eachNewTapeIndex}/mediaLabel`}
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
                                        name={`${eachNewTapeIndex}/initial`}
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

            <TextInput
                name={`eta`}
                value={formObj.eta.split(":00.000Z")[0]}
                type={"datetime-local"}
                label={"expected arrival"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    runSameOnAll()

                    formObjSet(prevFormObj => {
                        if (prevFormObj === null) return prevFormObj
                        const newFormObj = { ...prevFormObj }

                        newFormObj.eta = `${e.target.value}:00.000Z`

                        return newFormObj
                    })
                }}
                onBlur={() => { checkIfValid(formObj) }}
                errors={formErrors["eta"]}
            />

        </div>
    )
}
