"use client"
import { deepClone } from '@/utility/utility'
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '@/components/textInput/TextInput'
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { getTapes } from '@/serverFunctions/handleTapes'
import toast from 'react-hot-toast'
import ViewTape from '@/components/tapes/ViewTape'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'
import { company, resourceAuthType, tape, tapeWithdrawFormNonNullDataType, tapeWithdrawFormSchema, tapeWithdrawFormType } from '@/types'

export function EditTapeWithdrawForm({ seenFormData, handleFormUpdate, seenCompanyId }: { seenFormData: tapeWithdrawFormType["data"], handleFormUpdate: (updatedFormData: tapeWithdrawFormNonNullDataType) => void, seenCompanyId: company["id"] }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: tapeWithdrawFormNonNullDataType = {
        tapesToWithdraw: [],
    }
    const [formObj, formObjSet] = useState<tapeWithdrawFormType["data"]>(deepClone(seenFormData !== null ? seenFormData : initialFormObj))

    // type tapeDepositFormTypeNonNullKeys = keyof tapeDepositFormNonNullDataType
    const [formErrors, formErrorsSet] = useState<Partial<{ [key: string]: string }>>({})

    const userInteracting = useRef(false)
    const [tapes, tapesSet] = useState<tape[]>([])

    //handle changes from above
    useEffect(() => {
        if (seenFormData === null) return

        formObjSet(deepClone(seenFormData))

    }, [seenFormData])

    //send changes up
    useEffect(() => {
        const formIsValid = Object.entries(formErrors).length < 1

        if (!userInteracting.current || formObj === null || !formIsValid) return

        //reset so no loop
        userInteracting.current = false

        //send up the update
        handleFormUpdate(formObj)

    }, [formObj, formErrors])

    //search tapes
    useEffect(() => {
        const search = async () => {
            handleSearchTapes()
        }
        search()

    }, [seenCompanyId, resourceAuth])

    function checkIfValid(seenFormObj: tapeWithdrawFormNonNullDataType): boolean {
        const testSchema = tapeWithdrawFormSchema.shape.data.safeParse(seenFormObj);
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

    function runSameOnAllFormObjUpdates() {
        userInteracting.current = true
    }

    async function handleSearchTapes() {
        try {
            if (resourceAuth === undefined) return

            const seenTapes = await getTapes({ type: "status", tapeLocation: "in-vault", getOppositeOfStatus: false }, seenCompanyId, resourceAuth)
            tapesSet(seenTapes)

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    if (formObj === null) return null

    return (
        <div className={styles.form}>
            <label>tapes</label>

            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                <button className='button3'
                    onClick={() => {
                        toast.success("searching")

                        handleSearchTapes()
                    }}
                >search tapes</button>

                {tapes.length > 0 && (
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 300px)", overflow: "auto" }} className='snap'>
                        {tapes.map((eachTape, eachTapeIndex) => {
                            return (
                                <ViewTape key={eachTapeIndex} seenTape={eachTape}
                                    addFunction={() => {
                                        runSameOnAllFormObjUpdates()

                                        formObjSet(prevFormObj => {
                                            if (prevFormObj === null) return prevFormObj
                                            const newFormObj = { ...prevFormObj }

                                            //if id check if in array already - update that record
                                            const foundInNewTapes = newFormObj.tapesToWithdraw.find(eachTapeFind => eachTapeFind.id === eachTape.id) !== undefined

                                            if (foundInNewTapes) {
                                                newFormObj.tapesToWithdraw = newFormObj.tapesToWithdraw.map(eachTapeMap => {
                                                    if (eachTapeMap.id === eachTape.id) {
                                                        return eachTape
                                                    }

                                                    return eachTapeMap
                                                })

                                            } else {
                                                newFormObj.tapesToWithdraw = [...newFormObj.tapesToWithdraw, eachTape]
                                            }

                                            return newFormObj
                                        })

                                        toast.success(`added ${eachTape.mediaLabel}`)
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            {formObj.tapesToWithdraw.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 400px)", overflow: "auto" }} className='snap'>
                        {formObj.tapesToWithdraw.map((eachTape, eachTapeIndex) => {
                            return (
                                <div key={eachTapeIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", position: "relative" }}>
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
                                                if (prevFormObj === null) return prevFormObj
                                                const newFormObj = { ...prevFormObj }

                                                newFormObj.tapesToWithdraw = newFormObj.tapesToWithdraw.filter((eachTapeFilter, eachNewTapeFilterIndex) => eachNewTapeFilterIndex !== eachTapeIndex)

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <TextInput
                                        name={`${eachTapeIndex}/mediaLabel`}
                                        value={eachTape.mediaLabel}
                                        type={"text"}
                                        label={"media label"}
                                        placeHolder={"enter the tape media label"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                if (prevFormObj === null) return prevFormObj
                                                const newFormObj = { ...prevFormObj }

                                                newFormObj.tapesToWithdraw[eachTapeIndex].mediaLabel = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfValid(formObj) }}
                                        errors={formErrors[`tapesToWithdraw/${eachTapeIndex}/mediaLabel`]}
                                    />

                                    <TextInput
                                        name={`${eachTapeIndex}/initial`}
                                        value={eachTape.initial}
                                        type={"text"}
                                        label={"initial"}
                                        placeHolder={"enter the tape initial"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            runSameOnAllFormObjUpdates()

                                            formObjSet(prevFormObj => {
                                                if (prevFormObj === null) return prevFormObj
                                                const newFormObj = { ...prevFormObj }

                                                newFormObj.tapesToWithdraw[eachTapeIndex].initial = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfValid(formObj) }}
                                        errors={formErrors[`tapesToWithdraw/${eachTapeIndex}/initial`]}
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
                        if (prevFormObj === null) return prevFormObj
                        const newFormObj = { ...prevFormObj }

                        const newTape: tapeWithdrawFormNonNullDataType["tapesToWithdraw"][number] = {
                            companyId: seenCompanyId,
                            initial: "",
                            mediaLabel: "",
                            tapeLocation: "in-vault"
                        }

                        newFormObj.tapesToWithdraw = [...newFormObj.tapesToWithdraw, newTape]

                        return newFormObj
                    })
                }}
            >add tape</button>
        </div>
    )
}

export function ViewTapeWithdrawForm({ seenFormData }: { seenFormData: tapeWithdrawFormType["data"] }) {
    if (seenFormData === null) return null

    return (
        <div className={styles.form}>
            <label>tapes</label>

            {seenFormData.tapesToWithdraw.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 300px)", overflow: "auto" }} className='snap'>
                        {seenFormData.tapesToWithdraw.map((eachTapeToWithdraw, eachTapeToWithdrawIndex) => {
                            return (
                                <ViewTape key={eachTapeToWithdrawIndex} seenTape={eachTapeToWithdraw} />
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
