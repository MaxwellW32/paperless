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
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import ShowMore from '../showMore/ShowMore'

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

            //show latest changes
            await refreshAdminPath()

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
                        <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
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
                    <ConfirmationBox text='remove' confirmationText='are you sure you want to remove?' successMessage='removed!' float={true}
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

                const objectKeyRemoveButton = (
                    <ConfirmationBox text='' confirmationText='are you sure you want to remove?' successMessage='removed!'
                        icon={
                            <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                        }

                        buttonProps={{ style: { justifySelf: "flex-end" } }}
                        runAction={async () => {
                            const newForm: checklistItemFormType = JSON.parse(JSON.stringify(seenForm))
                            const keyArray = seenKeys.split('/')

                            let tempForm = newForm

                            for (let i = 0; i < keyArray.length; i++) {
                                const subKey = keyArray[i]

                                if (i === keyArray.length - 1) {
                                    // @ts-expect-error type
                                    delete tempForm[subKey]

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

                if (typeof eachValue === 'object' && eachValue !== null) {
                    const isArray = Array.isArray(eachValue)

                    return (
                        <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", }}>
                            <ShowMore
                                label={label}
                                content={(
                                    <>
                                        {objectKeyRemoveButton}

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
                            {objectKeyRemoveButton}

                            {parentArrayName && arrayRemoveButton}

                            <label htmlFor={seenKeys}>{label} - type: {typeof eachValue}</label>


                            {/* {(typeof eachValue === 'string' || typeof eachValue === 'number') && (
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
                            )} */}
                        </div>
                    )
                }
            })}

            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                <input type='text' value={newKeyName} placeholder='enter key name'
                    onChange={(e) => {
                        const seenNewKeyText = e.target.value.replace(/ /g, "")

                        newKeyNameSet(seenNewKeyText)
                    }}
                />

                <button className='button1'
                    onClick={() => {
                        if (newKeyName === "") {
                            toast.error("need to add a key name")
                            return
                        }

                        const newForm = { ...seenForm }

                        //@ts-expect-error type
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