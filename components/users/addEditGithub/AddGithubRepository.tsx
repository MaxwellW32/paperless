"use client"
import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import TextInput from '@/components/textInput/TextInput'
import TextArea from '@/components/textArea/TextArea'
import { githubTokenType, newGithubRepoSchema, newGithubRepoType } from '@/types'
import { addGithubRepo } from '@/serverFunctions/handleGithub'

export default function AddGithubRepository({ seenGithubToken, functionSubmit }: { seenGithubToken: githubTokenType, functionSubmit?: () => void }) {
    const initialFormObj: newGithubRepoType = {
        name: "",
        description: "",
        private: false
    }

    const [formObj, formObjSet] = useState<newGithubRepoType>(deepClone(initialFormObj))
    type newGithubRepoKeys = keyof newGithubRepoType

    type moreFormInfoType = Partial<{
        [key in newGithubRepoKeys]: {
            label?: string,
            placeHolder?: string,
            type?: string,
            required?: boolean
            inputType: "input" | "textarea",
        }
    }>

    const [moreFormInfo,] = useState<moreFormInfoType>({
        "name": {
            label: "name",
            inputType: "input",
            placeHolder: "Enter the new repository name",
        },
        "description": {
            label: "description",
            inputType: "input",
            placeHolder: "Enter repository description",
        },
        "private": {
            label: "visibility",
            inputType: "input",
            placeHolder: "set whether public or private.",
        }
    });

    const [formErrors, formErrorsSet] = useState<Partial<{
        [key in newGithubRepoKeys]: string
    }>>({})

    function checkIfValid(seenFormObj: newGithubRepoType, seenName: keyof newGithubRepoType, schema: typeof newGithubRepoSchema) {
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
            //validate each
            const validatedNewGithubRepo = newGithubRepoSchema.parse(formObj)

            await addGithubRepo(seenGithubToken.token, validatedNewGithubRepo)

            //notify
            toast.success(`New repository created!`)

            //reset
            formObjSet(deepClone(initialFormObj))

            if (functionSubmit !== undefined) {
                functionSubmit()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            <React.Fragment>
                {Object.entries(formObj).map(eachEntry => {
                    const eachKey = eachEntry[0] as newGithubRepoKeys

                    if (moreFormInfo[eachKey] === undefined) return null

                    if (eachKey === "private" && formObj.private !== undefined) {
                        return (
                            <React.Fragment key={eachKey}>
                                <button className='mainButton'
                                    onClick={() => {
                                        formObjSet(prevFormObj => {
                                            const newFormObj = deepClone(prevFormObj)
                                            if (newFormObj.private === undefined) return prevFormObj

                                            const seenVal = newFormObj.private
                                            newFormObj.private = !seenVal

                                            return newFormObj
                                        })
                                    }}
                                >visiblity {formObj.private ? "private" : "public"}</button>
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
                                            if (eachKey === "private") return prevFormObj

                                            newFormObj[eachKey] = e.target.value
                                            return newFormObj
                                        })
                                    }}
                                    onBlur={() => { checkIfValid(formObj, eachKey, newGithubRepoSchema) }}
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
                                            if (eachKey === "private") return prevFormObj

                                            //@ts-expect-error type
                                            newFormObj[eachKey] = e.target.value
                                            return newFormObj
                                        })
                                    }}
                                    onBlur={() => { checkIfValid(formObj, eachKey, newGithubRepoSchema) }} errors={formErrors[eachKey]}
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
