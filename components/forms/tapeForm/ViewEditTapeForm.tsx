"use client"
import { spaceCamelCase, deepClone } from '@/utility/utility'
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
import { company, resourceAuthType, tape, tapeFormNewTapeType, tapeFormSchema, tapeFormType } from '@/types'
import { getInitialTapeData } from '@/components/tapes/getTapeData'

export function EditTapeForm({ seenForm, handleFormUpdate, seenCompanyId }: { seenForm: tapeFormType, handleFormUpdate: (updatedFormData: tapeFormType) => void, seenCompanyId: company["id"] }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: tapeFormType = {
        type: seenForm.type,
        data: {
            tapesInRequest: [],
        }
    }
    const [formObj, formObjSet] = useState<tapeFormType>(deepClone(seenForm.data !== null ? seenForm : initialFormObj))

    // type tapeDepositFormTypeNonNullKeys = keyof tapeDepositFormNonNullDataType
    const [formErrors, formErrorsSet] = useState<Partial<{ [key: string]: string }>>({})

    const userInteracting = useRef(false)
    const [tapes, tapesSet] = useState<tape[]>([])

    //handle changes from above
    useEffect(() => {
        if (seenForm.data === null) return

        formObjSet(deepClone(seenForm))

    }, [seenForm])

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

    function checkIfValid(seenFormObj: tapeFormType): boolean {
        const testSchema = tapeFormSchema.safeParse(seenFormObj);
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

            const seenTapes = await getTapes({ type: "status", tapeLocation: formObj.type === "tapeDeposit" ? "with-client" : "in-vault", getOppositeOfStatus: false, companyId: seenCompanyId }, resourceAuth)
            tapesSet(seenTapes)

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    if (formObj.data === null) return null

    return (
        <div className={styles.form}>
            <label>{spaceCamelCase(formObj.type)}</label>

            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                <button className='button3'
                    onClick={() => {
                        toast.success("searching")

                        handleSearchTapes()
                    }}
                >search tapes</button>

                {tapes.length > 0 && (
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto", gridTemplateRows: "350px" }} className='snap'>
                        {tapes.map((eachTape, eachTapeIndex) => {
                            return (
                                <ViewTape key={eachTapeIndex} seenTape={eachTape}
                                    addFunction={() => {
                                        runSameOnAllFormObjUpdates()

                                        formObjSet(prevFormObj => {
                                            const newFormObj = { ...prevFormObj }
                                            if (newFormObj.data === null) return prevFormObj

                                            //refresh
                                            newFormObj.data = { ...newFormObj.data }

                                            //if id check if in array already - update that record
                                            const foundInNewTapes = newFormObj.data.tapesInRequest.find(eachTapeFind => eachTapeFind.id === eachTape.id) !== undefined

                                            if (foundInNewTapes) {
                                                newFormObj.data.tapesInRequest = newFormObj.data.tapesInRequest.map(eachTapeInRequestMap => {
                                                    if (eachTapeInRequestMap.id === eachTape.id) {
                                                        return eachTape
                                                    }

                                                    return eachTapeInRequestMap
                                                })

                                            } else {
                                                newFormObj.data.tapesInRequest = [...newFormObj.data.tapesInRequest, eachTape]
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

            {formObj.data.tapesInRequest.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 400px)", overflow: "auto" }} className='snap'>
                        {formObj.data.tapesInRequest.map((eachTape, eachTapeIndex) => {
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
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.tapesInRequest = newFormObj.data.tapesInRequest.filter((eachTapeFilter, eachNewTapeFilterIndex) => eachNewTapeFilterIndex !== eachTapeIndex)

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
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.tapesInRequest[eachTapeIndex].mediaLabel = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfValid(formObj) }}
                                        errors={formErrors[`data/tapesInRequest/${eachTapeIndex}/mediaLabel`]}
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
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.data === null) return prevFormObj

                                                //refresh
                                                newFormObj.data = { ...newFormObj.data }

                                                newFormObj.data.tapesInRequest[eachTapeIndex].initial = e.target.value

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => { checkIfValid(formObj) }}
                                        errors={formErrors[`data/tapesInRequest/${eachTapeIndex}/initial`]}
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

                        const newTape: tapeFormNewTapeType = getInitialTapeData(seenCompanyId)

                        newFormObj.data.tapesInRequest = [...newFormObj.data.tapesInRequest, newTape]
                        return newFormObj
                    })
                }}
            >add tape</button>
        </div>
    )
}

export function ViewTapeForm({ seenForm }: { seenForm: tapeFormType }) {
    if (seenForm.data === null) return null

    return (
        <div className={styles.form}>
            <label>{spaceCamelCase(seenForm.type)} tapes</label>

            {seenForm.data.tapesInRequest.length > 0 && (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(100%, 300px)", overflow: "auto" }} className='snap'>
                        {seenForm.data.tapesInRequest.map((eachTapeInRequest, eachTapeInRequestIndex) => {
                            return (
                                <ViewTape key={eachTapeInRequestIndex} seenTape={eachTapeInRequest} />
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}