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
import { resourceAuthGlobal, userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { company, resourceAuthType, searchObj, tape, tapeFormNewTapeSchema, tapeFormNewTapeType, tapeFormType, userDepartmentCompanySelection } from '@/types'
import { getInitialTapeData } from '@/components/tapes/getTapeData'
import ShowMore from '@/components/showMore/ShowMore'
import SearchWithInput from '@/components/tapes/SearchWithInput'

export function EditTapeForm({ seenForm, handleFormUpdate, seenCompanyId }: { seenForm: tapeFormType, handleFormUpdate: (updatedFormData: tapeFormType) => void, seenCompanyId: company["id"] }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: tapeFormType = {
        type: seenForm.type,
        data: {
            tapesInRequest: [],
        }
    }
    const [formObj, formObjSet] = useState<tapeFormType>(deepClone(seenForm.data !== null ? seenForm : initialFormObj))

    type tapeFormNewTapeKeys = keyof tapeFormNewTapeType
    const [tapeInRequestErrors, tapeInRequestErrorsSet] = useState<{ [key: string]: Partial<{ [key in tapeFormNewTapeKeys]: string }> }>({})

    const userInteracting = useRef(true) //set to true so sends up once

    const [tapesSearchObj, tapesSearchObjSet] = useState<searchObj<tape>>({
        searchItems: [],
    })

    //handle changes from above
    useEffect(() => {
        if (seenForm.data === null) return

        formObjSet(deepClone(seenForm))

    }, [seenForm])

    //send changes up
    useEffect(() => {
        const formIsValid = Object.entries(tapeInRequestErrors).length < 1

        //if user not interacting, or form has errors don't send up
        if (!userInteracting.current || formObj.data === null || !formIsValid) return

        //reset so no loop
        userInteracting.current = false

        //send up the update
        handleFormUpdate(formObj)

    }, [formObj, tapeInRequestErrors])

    function checkIfTapeInRequestValid(seenFormObj: Partial<tapeFormNewTapeType>, seenName: keyof tapeFormNewTapeType, index: number) {
        //@ts-expect-error type
        const testSchema = tapeFormNewTapeSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            tapeInRequestErrorsSet(prevObj => {
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
            tapeInRequestErrorsSet(prevObj => {
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
                label='search tapes'
                content={
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", }}>
                        <SearchWithInput
                            searchObj={tapesSearchObj}
                            searchObjSet={tapesSearchObjSet}
                            allSearchFunc={async () => {
                                if (resourceAuth === undefined) throw new Error("no auth seen")

                                return await getTapes({ tapeLocation: formObj.type === "tapeDeposit" ? "with-client" : "in-vault", companyId: seenCompanyId }, resourceAuth, tapesSearchObj.limit, tapesSearchObj.offset)
                            }}
                            specificSearchFunc={async seenText => {
                                if (resourceAuth === undefined) throw new Error("no auth seen")

                                return await getTapes({ tapeLocation: formObj.type === "tapeDeposit" ? "with-client" : "in-vault", companyId: seenCompanyId, mediaLabel: seenText }, resourceAuth, tapesSearchObj.limit, tapesSearchObj.offset)
                            }}
                            label={<h3>filter by media label</h3>}
                            placeHolder={"enter tape media label"}
                        />

                        {tapesSearchObj.searchItems.length > 0 && (
                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto", gridTemplateRows: "350px" }} className='snap'>
                                {tapesSearchObj.searchItems.map((eachTape, eachTapeIndex) => {
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
                }
            />

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
                                        onBlur={() => { checkIfTapeInRequestValid(eachTape, "mediaLabel", eachTapeIndex) }}
                                        errors={tapeInRequestErrors[eachTapeIndex]?.["mediaLabel"]}
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
                                        onBlur={() => { checkIfTapeInRequestValid(eachTape, "initial", eachTapeIndex) }}
                                        errors={tapeInRequestErrors[eachTapeIndex]?.["initial"]}
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