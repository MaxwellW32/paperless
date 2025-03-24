"use client"
import React, { HTMLAttributes, useEffect, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '../textInput/TextInput'
import TextArea from '../textArea/TextArea'
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistItemType, checklistStarter, checklistStarterSchema, newChecklistStarter, newChecklistStarterSchema, updateChecklistStarterSchema } from '@/types'
import { addChecklistStarters, updateChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import { MakeRecursiveChecklistForm } from '../recursiveChecklistForm/RecursiveChecklistForm'

export default function AddEditChecklistStarter({ sentChecklistStarter, submissionAction, ...elProps }: { sentChecklistStarter?: checklistStarter, submissionAction?: () => void } & HTMLAttributes<HTMLFormElement>) {
    const initialFormObj: newChecklistStarter = {
        type: "",
        checklist: []
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<checklistStarter>>(deepClone(sentChecklistStarter !== undefined ? updateChecklistStarterSchema.parse(sentChecklistStarter) : initialFormObj))
    type checklistStarterKeys = keyof Partial<checklistStarter>

    type moreFormInfoType = Partial<{
        [key in Partial<checklistStarterKeys>]: {
            label?: string,
            placeHolder?: string,
            type?: string,
            required?: boolean
            inputType: "input" | "textarea",
        } }>
    const [moreFormInfo,] = useState<moreFormInfoType>({
        "type": {
            label: "type",
            inputType: "input",
            placeHolder: "Enter client request type e.g. tape deposit",
        },
        "checklist": {
            label: "checklist",
            inputType: "input",
            placeHolder: "Enter checklist",
        },
    });

    const [formErrors, formErrorsSet] = useState<Partial<{ [key in checklistStarterKeys]: string }>>({})

    //add checklist items
    //edit checklist items
    const checklistTypeOptions: checklistItemType["type"][] = ["form", "email", "manual"]

    //handle changes from aboe
    useEffect(() => {
        if (sentChecklistStarter === undefined) return

        formObjSet(deepClone(updateChecklistStarterSchema.parse(sentChecklistStarter)))

    }, [sentChecklistStarter])

    function checkIfValid(seenFormObj: Partial<checklistStarter>, seenName: keyof Partial<checklistStarter>, schema: typeof checklistStarterSchema) {
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
            if (sentChecklistStarter === undefined) {
                //make new checklist starter

                //validate
                const validatedNewChecklistStarter: newChecklistStarter = newChecklistStarterSchema.parse(formObj)

                //send up to server
                await addChecklistStarters(validatedNewChecklistStarter)

                toast.success("checklist starter added")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedChecklistStarter = updateChecklistStarterSchema.parse(formObj)

                //update
                updateChecklistStarters(sentChecklistStarter.id, validatedUpdatedChecklistStarter)

                toast.success("checklist starter updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function updateChecklist(sentChecklist: checklistItemType[]) {
        formObjSet(prevFormObj => {
            const newFormObj = { ...prevFormObj }

            newFormObj.checklist = [...sentChecklist]

            return newFormObj
        })
    }

    return (
        <form {...elProps} className={styles.form} action={() => { }}>
            {Object.entries(formObj).map(eachEntry => {
                const eachKey = eachEntry[0] as checklistStarterKeys

                if (moreFormInfo[eachKey] === undefined) return null

                if (eachKey === "checklist") {
                    const seenChecklist = formObj[eachKey]
                    if (seenChecklist === undefined) return null

                    return (
                        <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", marginTop: "1rem" }}>
                            <label>Checklist</label>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                {checklistTypeOptions.map(eachOption => {
                                    return (
                                        <button key={eachOption} className='button1'
                                            onClick={() => {
                                                const newChecklistItem: checklistItemType | null =
                                                    eachOption === "form" ? {
                                                        type: "form",
                                                        data: {},
                                                        completed: false
                                                    } :
                                                        eachOption === "email" ? {
                                                            type: "email",
                                                            to: "",
                                                            subject: "",
                                                            email: "",
                                                            completed: false
                                                        } :
                                                            eachOption === "manual" ? {
                                                                type: "manual",
                                                                prompt: "",
                                                                completed: false
                                                            } : null

                                                if (newChecklistItem === null) return

                                                const newChecklist = [...seenChecklist, newChecklistItem]

                                                updateChecklist(newChecklist)
                                            }}
                                        >add {eachOption}</button>
                                    )
                                })}
                            </div>

                            {seenChecklist.length > 0 && (
                                <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                    {seenChecklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                                        return (
                                            <div key={eachChecklistItemIndex} style={{ display: "grid", alignContent: "flex-start", gap: "1rem", backgroundColor: "rgb(var(--shade4))", padding: "1rem" }}>
                                                <ConfirmationBox text='remove' confirmationText='are you sure you want to remove?' successMessage='removed!'
                                                    buttonProps={{
                                                        style: {
                                                            justifySelf: "flex-end"
                                                        }
                                                    }}
                                                    runAction={async () => {
                                                        const newChecklist = seenChecklist.filter((eachChecklistFilter, eachChecklistFilterIndex) => eachChecklistFilterIndex !== eachChecklistItemIndex)

                                                        updateChecklist(newChecklist)
                                                    }}
                                                />

                                                <label>{eachChecklistItem.type}</label>

                                                {eachChecklistItem.type === "form" && (
                                                    <MakeRecursiveChecklistForm seenForm={eachChecklistItem.data}
                                                        handleFormUpdate={(seenLatestForm) => {
                                                            //edit new checklist item
                                                            const newChecklistItem = { ...eachChecklistItem }
                                                            newChecklistItem.data = seenLatestForm

                                                            //edit new checklist at index
                                                            const newChecklist = [...seenChecklist]
                                                            newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                            updateChecklist(newChecklist)
                                                        }}
                                                    />
                                                )}

                                                {eachChecklistItem.type === "email" && (
                                                    <>
                                                        <input type='text' value={eachChecklistItem.to} placeholder='Enter send to'
                                                            onChange={(e) => {
                                                                //edit new checklist item
                                                                const newChecklistItem = { ...eachChecklistItem }
                                                                newChecklistItem.to = e.target.value

                                                                //edit new checklist at index
                                                                const newChecklist = [...seenChecklist]
                                                                newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                updateChecklist(newChecklist)
                                                            }}
                                                        />

                                                        <input type='text' value={eachChecklistItem.subject} placeholder='Enter email subject'
                                                            onChange={(e) => {
                                                                //edit new checklist item
                                                                const newChecklistItem = { ...eachChecklistItem }
                                                                newChecklistItem.subject = e.target.value

                                                                //edit new checklist at index
                                                                const newChecklist = [...seenChecklist]
                                                                newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                updateChecklist(newChecklist)
                                                            }}
                                                        />

                                                        <textarea rows={5} value={eachChecklistItem.email} placeholder='Enter email to send'
                                                            onChange={(e) => {
                                                                //edit new checklist item
                                                                const newChecklistItem = { ...eachChecklistItem }
                                                                newChecklistItem.email = e.target.value

                                                                //edit new checklist at index
                                                                const newChecklist = [...seenChecklist]
                                                                newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                updateChecklist(newChecklist)
                                                            }}
                                                        />
                                                    </>
                                                )}

                                                {eachChecklistItem.type === "manual" && (
                                                    <>
                                                        <input type='text' value={eachChecklistItem.prompt} placeholder='Enter prompt to ask user'
                                                            onChange={(e) => {
                                                                //edit new checklist item
                                                                const newChecklistItem = { ...eachChecklistItem }
                                                                newChecklistItem.prompt = e.target.value

                                                                //edit new checklist at index
                                                                const newChecklist = [...seenChecklist]
                                                                newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                updateChecklist(newChecklist)
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div >
                    )
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

                                        newFormObj[eachKey] = e.target.value

                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, checklistStarterSchema) }}
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

                                        // @ts-expect-error type
                                        newFormObj[eachKey] = e.target.value

                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, checklistStarterSchema) }}
                                errors={formErrors[eachKey]}
                            />
                        ) : null}
                    </React.Fragment>
                )
            })}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentChecklistStarter ? "update" : "submit"}</button>
        </form>
    )
}