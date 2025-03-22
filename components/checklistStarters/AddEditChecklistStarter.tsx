"use client"
import React, { HTMLAttributes, useEffect, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '../textInput/TextInput'
import TextArea from '../textArea/TextArea'
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistItemFormType, checklistItemType, checklistStarter, checklistStarterSchema, newChecklistStarter, newChecklistStarterSchema, updateChecklistStarterSchema } from '@/types'
import { addChecklistStarters, updateChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { refreshAdminPath } from '@/serverFunctions/handleServer'
import RecursiveConfirmationBox from '../recursiveForm/RecursiveConfirmationBox'
import RecursiveShowMore from '../recursiveForm/RecursiveShowMore'

export default function AddEditChecklistStarter({ sentChecklistStarter, ...elProps }: { sentChecklistStarter?: checklistStarter, } & HTMLAttributes<HTMLFormElement>) {
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

                //show latest changes
                await refreshAdminPath()

                toast.success("checklist starter added")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedChecklistStarter = updateChecklistStarterSchema.parse(formObj)

                //update
                updateChecklistStarters(validatedUpdatedChecklistStarter.type, validatedUpdatedChecklistStarter)

                //show latest changes
                await refreshAdminPath()
            }


        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form {...elProps} className={styles.form} action={() => { }}>
            {Object.entries(formObj).map(eachEntry => {
                const eachKey = eachEntry[0] as checklistStarterKeys

                if (moreFormInfo[eachKey] === undefined) return null

                if (eachKey === "checklist") {
                    const seenChecklist = formObj[eachKey]
                    if (seenChecklist === undefined) return null

                    function updateChecklist(sentChecklist: checklistItemType[]) {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }

                            newFormObj.checklist = [...sentChecklist]

                            return newFormObj
                        })
                    }

                    return (
                        <RenderChecklist key={eachKey} seenChecklist={seenChecklist} updateChecklist={updateChecklist} />
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

            <button className='mainButton' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >Submit</button>
        </form>
    )
}


function RenderChecklist({ seenChecklist, updateChecklist }: {
    seenChecklist: checklistItemType[], updateChecklist(sentChecklist: checklistItemType[]): void
}) {
    //add checlist items
    //edit checklist items
    const checklistTypeOptions: checklistItemType["type"][] = ["form", "email", "manual"]

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
                {checklistTypeOptions.map(eachOption => {
                    return (
                        <button key={eachOption}
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
                            <React.Fragment key={eachChecklistItemIndex}>
                                {eachChecklistItem.type === "form" && (
                                    <RecursiveAddToChecklistForm seenForm={eachChecklistItem.data} sentKeys=''
                                        handleFormUpdate={(seenLatestForm) => {
                                            //edit new checklist item
                                            const newChecklistItem = { ...eachChecklistItem }
                                            newChecklistItem.data = seenLatestForm as checklistItemFormType["data"]

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
                            </React.Fragment>
                        )
                    })}
                </div>
            )}
        </div >
    )
}

function RecursiveAddToChecklistForm({ seenForm, handleFormUpdate, parentArrayName, sentKeys, ...elProps }: { seenForm: object, handleFormUpdate: (latestForm: object) => void, parentArrayName?: string, sentKeys: string } & React.HTMLAttributes<HTMLDivElement>) {
    //recursively view whats there
    //update any level with a key value combo
    //later update the form to handle different data types
    const [newKeyName, newKeyNameSet] = useState("")

    function runSameOnAll() {

    }

    return (
        <div {...elProps} style={{ display: "grid", gap: "1rem", ...(parentArrayName ? { gridAutoColumns: "90%", gridAutoFlow: "column" } : { alignContent: "flex-start" }), overflow: "auto", ...elProps?.style }} className={`${parentArrayName ? "snap" : ""} ${elProps?.className}`}>
            {Object.entries(seenForm).map(eachEntry => {
                const eachKey = eachEntry[0]
                const eachValue = eachEntry[1]
                const seenKeys = sentKeys === "" ? eachKey : `${sentKeys}/${eachKey}`

                const arrayRemoveButton = (
                    <RecursiveConfirmationBox text='remove' confirmationText='are you sure you want to remove?' successMessage='removed!' float={true}
                        runAction={async () => {
                            runSameOnAll()
                            const newForm: checklistItemFormType = JSON.parse(JSON.stringify(seenForm))
                            const keyArray = seenKeys.split('/')

                            let tempForm = newForm
                            const indexToDelete = parseInt(keyArray[keyArray.length - 1])

                            for (let i = 0; i < keyArray.length; i++) {
                                const subKey = keyArray[i]

                                if (i === keyArray.length - 2) {
                                    // @ts-expect-error type
                                    tempForm[subKey] = tempForm[subKey].filter((each, eachIndex) => eachIndex !== indexToDelete)

                                } else {
                                    // @ts-expect-error type
                                    tempForm = tempForm[subKey]
                                }
                            }

                            handleFormUpdate(newForm)
                        }}
                    />
                )

                //replace camelcase key names with spaces and capitalize first letter
                const niceKeyName = eachKey.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })
                let label = niceKeyName

                const parsedNumberKey = parseInt(eachKey)
                if (!isNaN(parsedNumberKey) && parentArrayName !== undefined) {
                    label = `${parentArrayName.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })} ${parsedNumberKey + 1}`
                }

                let placeHolder = `please enter a value for ${label}`

                if (typeof eachValue === 'object' && eachValue !== null) {
                    const isArray = Array.isArray(eachValue)

                    return (
                        <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", }}>
                            <RecursiveShowMore
                                label={label}
                                content={(
                                    <>
                                        {parentArrayName && (
                                            arrayRemoveButton
                                        )}

                                        {isArray && (
                                            <>

                                                <button className='button1' style={{ alignSelf: "flex-start" }}
                                                    onClick={() => {

                                                    }}
                                                >add</button>
                                            </>
                                        )}

                                        <RecursiveAddToChecklistForm seenForm={eachValue} sentKeys={seenKeys} style={{ marginLeft: "1rem" }} parentArrayName={isArray ? eachKey : undefined} handleFormUpdate={handleFormUpdate} />
                                    </>
                                )}
                            />
                        </div>
                    )

                } else {

                    return (
                        <div key={seenKeys} style={{ display: "grid", alignContent: "flex-start", gap: ".5rem", width: "100%" }}>
                            {parentArrayName && arrayRemoveButton}

                            <label htmlFor={seenKeys}>{label}</label>

                            {(typeof eachValue === 'string' || typeof eachValue === 'number') && (
                                <>
                                    <input id={seenKeys} type={"text"} value={eachValue} placeholder={placeHolder}
                                        onChange={(e) => {
                                            runSameOnAll()

                                            const newForm: checklistItemFormType = JSON.parse(JSON.stringify(seenForm))
                                            const keyArray = seenKeys.split('/')

                                            let tempForm = newForm

                                            for (let i = 0; i < keyArray.length; i++) {
                                                const subKey = keyArray[i]

                                                if (i === keyArray.length - 1) {
                                                    let inputVal: string | number | null | undefined = e.target.value

                                                    // @ts-expect-error type
                                                    tempForm[subKey] = inputVal

                                                } else {
                                                    // @ts-expect-error type
                                                    tempForm = tempForm[subKey]
                                                }
                                            }

                                            handleFormUpdate(newForm)
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    )
                }
            })}

            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                <input type='text' value={newKeyName} placeholder='enter key name'
                    onChange={(e) => {
                        newKeyNameSet(e.target.value)
                    }}
                />

                <button
                    onClick={() => {
                        if (newKeyName === "") {
                            toast.error("need to add a key name")
                            return
                        }

                        const newForm = { ...seenForm }

                        newForm[newKeyName] = ""

                        handleFormUpdate(newForm)

                        //reset
                        newKeyNameSet("")
                    }}
                >add key</button>
            </div>
        </div>
    )
}