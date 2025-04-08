import { tapeDepositFormSchema, tapeDepositFormType, tapeDepositFormTypeNonNull } from '@/types'
import { deepClone } from '@/utility/utility'
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '@/components/textInput/TextInput'

//on deposit search tapes from db
//if client chooses a tape set it - id will be there
//when wrapping up request add tapes in list to db - update tapes with id

export function EditTapeDeposit({ seenForm, handleFormUpdate }: { seenForm: tapeDepositFormType["data"], handleFormUpdate: (updatedFormData: tapeDepositFormTypeNonNull) => void }) {
    const initialFormObj: tapeDepositFormTypeNonNull = {
        newTapes: [],
        eta: ""
    }
    const [formObj, formObjSet] = useState<tapeDepositFormType["data"]>(deepClone(seenForm !== null ? seenForm : initialFormObj))

    type tapeDepositFormTypeNonNullKeys = keyof tapeDepositFormTypeNonNull
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in tapeDepositFormTypeNonNullKeys]: string }>>({})

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

    function checkIfValid(seenFormObj: tapeDepositFormTypeNonNull, seenName: tapeDepositFormTypeNonNullKeys, schema: typeof tapeDepositFormSchema.shape.data): boolean {
        // @ts-expect-error type
        const testSchema = schema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }
                delete newObj[seenName]

                return newObj
            })

            return true

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

            return false
        }
    }

    function runSameOnAll() {
        userInteracting.current = true
    }

    if (formObj === null) return null

    return (
        <form action={() => { }} className={styles.form}>
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
                onBlur={() => { checkIfValid(formObj, "eta", tapeDepositFormSchema.shape.data) }}
                errors={formErrors["eta"]}
            />

            <label>tapes</label>

            <button className='button1'
                onClick={() => {
                    runSameOnAll()

                    formObjSet(prevFormObj => {
                        if (prevFormObj === null) return prevFormObj
                        const newFormObj = { ...prevFormObj }

                        const newTape: tapeDepositFormTypeNonNull["newTapes"][number] = {
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
                                        onBlur={() => { checkIfValid(formObj, "newTapes", tapeDepositFormSchema.shape.data) }}
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
                                        onBlur={() => { checkIfValid(formObj, "newTapes", tapeDepositFormSchema.shape.data) }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {formErrors["newTapes"] !== undefined && (
                        <p className='errorText'>{formErrors["newTapes"]}</p>
                    )}
                </>
            )}
        </form>
    )
}
