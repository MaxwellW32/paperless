"use client"
import React, { useEffect, useMemo, useState } from 'react'
import styles from "./style.module.css"
import TextInput from '../textInput/TextInput'
import TextArea from '../textArea/TextArea'
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import ShowMore from '../showMore/ShowMore'
import { checklistItemFormType, checklistStarter, clientRequest, clientRequestSchema, newClientRequest, newClientRequestSchema, updateClientRequestSchema, user, userToCompany } from '@/types'
import { Session } from 'next-auth'
import { getSpecificUser } from '@/serverFunctions/handleUser'
import { addClientRequests, updateClientRequests } from '@/serverFunctions/handleClientRequests'

export default function AddEditClientRequest({ checklistStarter, sentClientRequest, seenSession }: { checklistStarter: checklistStarter, sentClientRequest?: clientRequest, seenSession: Session }) {
    const initialFormObj: newClientRequest = {
        companyId: "",
        checklist: checklistStarter.checklist
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

    const [chosenUser, chosenUserSet] = useState<user | undefined>()
    const [activeUserToCompanyId, activeUserToCompanyIdSet] = useState<userToCompany["id"] | undefined>()

    const activeUserToCompany = useMemo<userToCompany | undefined>(() => {
        if (chosenUser === undefined || chosenUser.usersToCompanies === undefined || activeUserToCompanyId === undefined) return undefined

        return chosenUser.usersToCompanies.find(eachUserToCompany => eachUserToCompany.id === activeUserToCompanyId)
    }, [chosenUser?.usersToCompanies, activeUserToCompanyId])

    const [activeChecklistFormIndex,] = useState<number | undefined>(() => {
        if (formObj.checklist === undefined) return undefined

        const seendIndex = formObj.checklist.findIndex(eachChecklist => {
            if (eachChecklist.type === "form") {
                if (sentClientRequest === undefined) {
                    //new form 
                    return eachChecklist
                } else {
                    if (!eachChecklist.completed) {
                        return eachChecklist
                    }
                }
            }
        })

        if (seendIndex < 0) return undefined

        return seendIndex
    })

    //handle changes from above
    useEffect(() => {
        if (sentClientRequest === undefined) return

        formObjSet(deepClone(updateClientRequestSchema.parse(sentClientRequest)))

    }, [sentClientRequest])

    //if only one company for user set as active
    useEffect(() => {
        try {
            const search = async () => {
                //only run for clients accounts
                if (seenSession.user.fromDepartment) return

                const seenUser = await getSpecificUser(seenSession.user.id)

                if (seenUser === undefined || seenUser.usersToCompanies === undefined) return


                if (seenUser.usersToCompanies.length === 1) {
                    activeUserToCompanyIdSet(seenUser.usersToCompanies[0].id)
                }

                //set user
                chosenUserSet(seenUser)
            }
            search()

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [])


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
            if (activeUserToCompany === undefined) throw new Error("active user company undefined")

            if (sentClientRequest === undefined) {
                //make new client request

                formObj.companyId = activeUserToCompany.companyId

                //validate
                const validatedNewClientRequest: newClientRequest = newClientRequestSchema.parse(formObj)

                //send up to server
                await addClientRequests(validatedNewClientRequest, { companyIdBeingAccessed: activeUserToCompany.companyId })

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedClientRequest = updateClientRequestSchema.parse(formObj)

                //update
                await updateClientRequests(sentClientRequest.id, validatedUpdatedClientRequest, { companyIdBeingAccessed: activeUserToCompany.companyId })

                toast.success("request updated")
            }

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
                            {activeChecklistFormIndex !== undefined && formObj.checklist !== undefined && formObj.checklist[activeChecklistFormIndex].type === "form" && (
                                <RecursiveEditChecklistForm seenForm={formObj.checklist[activeChecklistFormIndex].data} sentKeys=''
                                    handleFormUpdate={(seenLatestForm) => {
                                        formObjSet(prevFormObj => {
                                            const newFormObj = { ...prevFormObj }
                                            if (newFormObj.checklist === undefined) return prevFormObj

                                            //edit new checklist item
                                            const newChecklistItem = { ...newFormObj.checklist[activeChecklistFormIndex] }
                                            if (newChecklistItem.type !== "form") return prevFormObj

                                            newChecklistItem.data = seenLatestForm as checklistItemFormType["data"]

                                            newFormObj.checklist[activeChecklistFormIndex] = newChecklistItem

                                            return newFormObj
                                        })
                                    }}
                                />
                            )}
                        </React.Fragment >
                    )
                }

                if (eachKey === "companyId") {
                    if (seenSession.user.fromDepartment) {
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
                                        if (eachKey === "status" || eachKey === "user" || eachKey === "company") return prevFormObj

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
                                        if (eachKey === "status" || eachKey === "user" || eachKey === "company") return prevFormObj

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




function RecursiveEditChecklistForm({ seenForm, handleFormUpdate, parentArrayName, sentKeys, ...elProps }: { seenForm: object, handleFormUpdate: (latestForm: object) => void, parentArrayName?: string, sentKeys: string } & React.HTMLAttributes<HTMLDivElement>) {
    //recursively view whats there
    //update any level with a key value combo
    //later update the form to handle different data types

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

                //replace camelcase key names with spaces and capitalize first letter
                const niceKeyName = eachKey.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })
                let label = niceKeyName

                const parsedNumberKey = parseInt(eachKey)
                if (!isNaN(parsedNumberKey) && parentArrayName !== undefined) {
                    label = `${parentArrayName.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })} ${parsedNumberKey + 1}`
                }

                const placeHolder = `Enter a starter value for ${label}`

                if (typeof eachValue === 'object' && eachValue !== null) {
                    const isArray = Array.isArray(eachValue)

                    return (
                        <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", }}>
                            <ShowMore
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

                                        <RecursiveEditChecklistForm seenForm={eachValue} sentKeys={seenKeys} style={{ marginLeft: "1rem" }} parentArrayName={isArray ? eachKey : undefined} handleFormUpdate={handleFormUpdate} />
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
                                                    const inputVal: string | number = e.target.value

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
        </div>
    )
}














































