"use client"
import React, { useEffect, useMemo, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '../textInput/TextInput'
import TextArea from '../textArea/TextArea'
import { deepClone, updateRefreshObj } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistStarter, clientRequest, clientRequestSchema, company, departmentCompanySelection, newClientRequest, newClientRequestSchema, refreshObjType, updateClientRequestSchema } from '@/types'
import { addClientRequests, updateClientRequests } from '@/serverFunctions/handleClientRequests'
import { ReadRecursiveChecklistForm } from '../recursiveChecklistForm/RecursiveChecklistForm'
import { useSession } from 'next-auth/react'
import { useAtom } from 'jotai'
import { departmentCompanySelectionGlobal, refreshObjGlobal } from '@/utility/globalState'

export default function AddEditClientRequest({ checklistStarter, sentClientRequest }: { checklistStarter?: checklistStarter, sentClientRequest?: clientRequest }) {
    const { data: session } = useSession()
    const [departmentCompanySelection,] = useAtom<departmentCompanySelection | null>(departmentCompanySelectionGlobal)

    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)

    const initialFormObj: newClientRequest = {
        companyId: "",
        checklist: checklistStarter !== undefined ? checklistStarter.checklist : [],
        checklistStarterId: checklistStarter !== undefined ? checklistStarter.id : ""
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<clientRequest>>(deepClone(sentClientRequest !== undefined ? updateClientRequestSchema.parse(sentClientRequest) : initialFormObj))
    type clientRequestKeys = keyof Partial<clientRequest>

    type moreFormInfoType = Partial<{
        [key in Partial<clientRequestKeys>]: {
            label?: string,
            placeHolder?: string,
            type?: string,
            required?: boolean
            inputType: "input" | "textarea",
        } }>
    const [moreFormInfo,] = useState<moreFormInfoType>({
        "companyId": {
            label: "type",
            inputType: "input",
            placeHolder: "Enter company id",
        },
        "checklist": {
            label: "checklist",
            inputType: "input",
            placeHolder: "Enter checklist",
        },
    });

    const [formErrors, formErrorsSet] = useState<Partial<{ [key in clientRequestKeys]: string }>>({})

    const [activeCompanyId, activeCompanyIdSet] = useState<company["id"] | undefined>()

    const [activeChecklistFormIndex, activeChecklistFormIndexSet] = useState<number | undefined>()

    const editableChecklistFormIndexes = useMemo<number[]>(() => {
        if (formObj.checklist === undefined) return []

        const newNumArray: number[] = []

        formObj.checklist.map((eachChecklist, eachChecklistIndex) => {
            if (eachChecklist.type !== "form") return
            if (formObj.checklist === undefined) return

            const previousIsComplete = eachChecklistIndex !== 0 ? formObj.checklist[eachChecklistIndex - 1].completed : true

            //if checklist item is a form and previous items are complete, make available to the client to edit
            if (previousIsComplete) {
                newNumArray.push(eachChecklistIndex)
            }
        })

        if (newNumArray.length === 1) {
            activeChecklistFormIndexSet(newNumArray[0])
        }

        return newNumArray

    }, [formObj.checklist])

    //handle changes from above
    useEffect(() => {
        if (sentClientRequest === undefined) return

        formObjSet(deepClone(updateClientRequestSchema.parse(sentClientRequest)))

    }, [sentClientRequest])

    //if only one company for user set as active
    useEffect(() => {
        try {
            const search = async () => {
                if (departmentCompanySelection === null) return

                //only run for clients accounts
                if (departmentCompanySelection.type !== "company") return

                activeCompanyIdSet(departmentCompanySelection.companyId)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [departmentCompanySelection])

    function checkIfValid(seenFormObj: Partial<clientRequest>, seenName: keyof Partial<clientRequest>, schema: typeof clientRequestSchema) {
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
            //send off new client request
            if (activeCompanyId === undefined) throw new Error("not seeing company id")

            if (sentClientRequest === undefined) {
                //make new client request

                //add on company id
                formObj.companyId = activeCompanyId

                //validate
                const validatedNewClientRequest: newClientRequest = newClientRequestSchema.parse(formObj)

                //validate the forms, then mark as complete

                //mark as complete
                validatedNewClientRequest.checklist = validatedNewClientRequest.checklist.map((eachChecklist, eachChecklistIndex) => {
                    if (eachChecklist.type === "form") {
                        //ensure checklist form present
                        if (activeChecklistFormIndex === undefined) throw new Error("checklist form not selected")

                        if (editableChecklistFormIndexes.includes(eachChecklistIndex)) {
                            eachChecklist.completed = true
                        }
                    }

                    return eachChecklist
                })

                //send up to server
                await addClientRequests(validatedNewClientRequest, { companyIdBeingAccessed: activeCompanyId })

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedClientRequest = updateClientRequestSchema.parse(formObj)

                //mark as complete
                validatedUpdatedClientRequest.checklist = validatedUpdatedClientRequest.checklist.map((eachChecklist, eachChecklistIndex) => {
                    if (eachChecklist.type === "form") {
                        //ensure checklist form present
                        if (activeChecklistFormIndex === undefined) throw new Error("checklist form not selected")

                        if (editableChecklistFormIndexes.includes(eachChecklistIndex)) {
                            eachChecklist.completed = true
                        }
                    }

                    return eachChecklist
                })

                //update
                await updateClientRequests(sentClientRequest.id, validatedUpdatedClientRequest, { companyIdBeingAccessed: activeCompanyId })

                toast.success("request updated")
            }

            refreshObjSet(prevRefreshObj => {
                return updateRefreshObj(prevRefreshObj, "clientRequests")
            })

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            {Object.entries(formObj).map(eachEntry => {
                const eachKey = eachEntry[0] as clientRequestKeys

                if (moreFormInfo[eachKey] === undefined) return null

                if (eachKey === "checklist") {
                    const seenChecklist = formObj[eachKey]
                    if (seenChecklist === undefined) return null

                    return (
                        <React.Fragment key={eachKey}>
                            {editableChecklistFormIndexes.length > 1 && (
                                <div>
                                    <label>choose active form</label>

                                    <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "50px" }}>
                                        {editableChecklistFormIndexes.map(eachEditableFormIndex => {
                                            return (
                                                <button className='button2' key={eachEditableFormIndex}
                                                    onClick={() => {
                                                        activeChecklistFormIndexSet(eachEditableFormIndex)
                                                    }}
                                                ></button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeChecklistFormIndex !== undefined && formObj.checklist !== undefined && formObj.checklist[activeChecklistFormIndex].type === "form" && (
                                <ReadRecursiveChecklistForm seenForm={formObj.checklist[activeChecklistFormIndex].data}
                                    handleFormUpdate={(seenLatestForm) => {
                                        formObjSet(prevFormObj => {
                                            const newFormObj = { ...prevFormObj }
                                            if (newFormObj.checklist === undefined) return prevFormObj

                                            //edit new checklist item
                                            const newChecklistItem = { ...newFormObj.checklist[activeChecklistFormIndex] }
                                            if (newChecklistItem.type !== "form") return prevFormObj

                                            newChecklistItem.data = seenLatestForm

                                            newFormObj.checklist[activeChecklistFormIndex] = newChecklistItem

                                            return newFormObj
                                        })
                                    }}
                                />
                            )}
                        </React.Fragment >
                    )
                }

                if (eachKey === "companyId" && session !== null) {
                    if (session.user.fromDepartment) {
                        //more options to come
                        return null

                    } else {
                        return null
                    }
                }
                return (
                    <React.Fragment key={eachKey}>
                        {moreFormInfo[eachKey].inputType === "input" ? (
                            <TextInput
                                name={eachKey}
                                value={`${formObj[eachKey]}`}
                                type={moreFormInfo[eachKey].type}
                                label={moreFormInfo[eachKey].label}
                                placeHolder={moreFormInfo[eachKey].placeHolder}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    formObjSet(prevFormObj => {
                                        const newFormObj = { ...prevFormObj }
                                        if (eachKey === "status" || eachKey === "user" || eachKey === "company" || eachKey === "checklistStarter" || eachKey === "dateSubmitted") return prevFormObj

                                        newFormObj[eachKey] = e.target.value

                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, clientRequestSchema) }}
                                errors={formErrors[eachKey]}
                            />
                        ) : moreFormInfo[eachKey].inputType === "textarea" ? (
                            <TextArea
                                name={eachKey}
                                value={`${formObj[eachKey]}`}
                                label={moreFormInfo[eachKey].label}
                                placeHolder={moreFormInfo[eachKey].placeHolder}
                                onInput={(e) => {
                                    formObjSet(prevFormObj => {
                                        const newFormObj = { ...prevFormObj }
                                        if (eachKey === "status" || eachKey === "user" || eachKey === "company" || eachKey === "checklistStarter" || eachKey === "dateSubmitted") return prevFormObj

                                        // @ts-expect-error type
                                        newFormObj[eachKey] = e.target.value

                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, clientRequestSchema) }}
                                errors={formErrors[eachKey]}
                            />
                        ) : null}
                    </React.Fragment>
                )
            })}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentClientRequest ? "update" : "submit"}</button>
        </form>
    )
}













































