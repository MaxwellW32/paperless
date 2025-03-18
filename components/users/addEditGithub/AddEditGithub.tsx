"use client"
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { newGithubTokenSchema, newGithubTokenType, githubTokenSchema, githubTokenType, updateGithubTokenSchema } from '@/types'
import TextInput from '@/components/textInput/TextInput'
import TextArea from '@/components/textArea/TextArea'
import { addUserGithubToken, updateUserGithubToken } from '@/serverFunctions/handleUser'

export default function AddEditGithub({ sentGithubToken, functionSubmit }: { sentGithubToken?: githubTokenType, functionSubmit?: () => void }) {
    const initialFormObj: newGithubTokenType = {
        token: "",
        active: true,
    }

    const [formObj, formObjSet] = useState<Partial<githubTokenType>>(deepClone(sentGithubToken === undefined ? initialFormObj : githubTokenSchema.parse(sentGithubToken)))
    type userGithubTokenKeys = keyof Partial<githubTokenType>

    type moreFormInfoType = Partial<{
        [key in userGithubTokenKeys]: {
            label?: string,
            placeHolder?: string,
            type?: string,
            required?: boolean
            inputType: "input" | "textarea",
        }
    }>

    const [moreFormInfo,] = useState<moreFormInfoType>({
        "token": {
            label: "token",
            inputType: "input",
            placeHolder: "Enter your github token",
        },
        "active": {
            label: "active",
            inputType: "input",
            placeHolder: "Enter whether token active",
        },
    });

    const [formErrors, formErrorsSet] = useState<Partial<{
        [key in userGithubTokenKeys]: string
    }>>({})

    function checkIfValid(seenFormObj: Partial<githubTokenType>, seenName: keyof Partial<githubTokenType>, schema: typeof githubTokenSchema) {
        //@ts-expect-error type
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
            if (sentGithubToken === undefined) {
                //validate each
                const validatedGithubToken = newGithubTokenSchema.parse(formObj)

                const addedGithubToken = await addUserGithubToken(validatedGithubToken)

                //notify
                toast.success(`Created github token for ${addedGithubToken.username}!`)
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate each
                const validatedUpdateGithubToken = updateGithubTokenSchema.parse(formObj)

                await updateUserGithubToken(sentGithubToken.id, validatedUpdateGithubToken)

                toast.success(`Updated github token token`)
            }

            if (functionSubmit !== undefined) {
                functionSubmit()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    //respond to changes above
    useEffect(() => {
        if (sentGithubToken === undefined) return
        formObjSet(githubTokenSchema.parse(sentGithubToken))

    }, [sentGithubToken])

    return (
        <form className={styles.form} action={() => { }}>
            <React.Fragment>
                {Object.entries(formObj).map(eachEntry => {
                    const eachKey = eachEntry[0] as userGithubTokenKeys

                    if (moreFormInfo[eachKey] === undefined) return null

                    if (eachKey === "active" && formObj.active !== undefined) {
                        return (
                            <React.Fragment key={eachKey}>
                                <button className='mainButton' style={{ backgroundColor: formObj.active ? "rgb(var(--color1))" : "" }}
                                    onClick={() => {
                                        formObjSet(prevFormObj => {
                                            const newFormObj = deepClone(prevFormObj)
                                            if (newFormObj.active === undefined) return prevFormObj

                                            const seenVal = newFormObj.active
                                            newFormObj.active = !seenVal

                                            return newFormObj
                                        })
                                    }}
                                >{formObj.active ? "using this token" : "inactive"}</button>
                            </React.Fragment>
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
                                            if (eachKey === "active") return prevFormObj

                                            newFormObj[eachKey] = e.target.value
                                            return newFormObj
                                        })
                                    }}
                                    onBlur={() => { checkIfValid(formObj, eachKey, githubTokenSchema) }}
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
                                            if (eachKey === "active") return prevFormObj

                                            //@ts-expect-error type
                                            newFormObj[eachKey] = e.target.value
                                            return newFormObj
                                        })
                                    }}
                                    onBlur={() => { checkIfValid(formObj, eachKey, githubTokenSchema) }} errors={formErrors[eachKey]}
                                />
                            ) : null}
                        </React.Fragment>
                    )
                })}
            </React.Fragment>

            <button className='mainButton' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >Submit</button>
        </form>
    )
}
