"use client"
import React, { HTMLAttributes, useEffect, useState } from 'react'
import styles from "./style.module.css"
import { handleManagePageOptions, newPage, newPageSchema, page, pageSchema, updatePageSchema, website } from '@/types'
import TextInput from '../textInput/TextInput'
import TextArea from '../textArea/TextArea'
import { deepClone, makeValidPageLinkName } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { addPage } from '@/serverFunctions/handlePages'

export default function AddEditPage({ sentWebsiteId, sentPage, handleManagePage, submissionAction, ...elProps }: { sentWebsiteId: website["id"], sentPage?: page, handleManagePage(options: handleManagePageOptions): Promise<void>, submissionAction?: () => void, } & HTMLAttributes<HTMLFormElement>) {
    const initialFormObj: newPage = {
        link: "",
        websiteId: sentWebsiteId
    }

    //form object hold page partial values
    //form obj can be set from newPage or update page requirements

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<page>>(deepClone(sentPage !== undefined ? updatePageSchema.parse(sentPage) : initialFormObj))
    type pageKeys = keyof Partial<page>

    type moreFormInfoType = Partial<{
        [key in Partial<pageKeys>]: {
            label?: string,
            placeHolder?: string,
            type?: string,
            required?: boolean
            inputType: "input" | "textarea",
        } }>
    const [moreFormInfo,] = useState<moreFormInfoType>({
        "link": {
            label: "link",
            inputType: "input",
            placeHolder: "Enter page link `/` for home",
        },
    });

    const [formErrors, formErrorsSet] = useState<Partial<{ [key in pageKeys]: string }>>({})

    //respond to changes above
    useEffect(() => {
        if (sentPage === undefined) return

        formObjSet(updatePageSchema.parse(sentPage))
    }, [sentPage])

    function checkIfValid(seenFormObj: Partial<page>, seenName: keyof Partial<page>, schema: typeof pageSchema) {
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
            if (sentPage === undefined) {
                //make new page

                //validate
                const validatedNewPage: newPage = newPageSchema.parse(formObj)

                //send up to server
                const seenAddedPage = await addPage(validatedNewPage)

                //send up to client
                handleManagePage({ option: "create", seenAddedPage: seenAddedPage })

                toast.success("page added")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedPage = updatePageSchema.parse(formObj)

                //send up to client
                handleManagePage({ option: "update", updatedPageId: sentPage.id, seenUpdatedPage: validatedUpdatedPage })

                toast.success("page updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }
        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form {...elProps} className={styles.form} action={() => { }}>
            {Object.entries(formObj).map(eachEntry => {
                const eachKey = eachEntry[0] as pageKeys

                if (moreFormInfo[eachKey] === undefined) return null

                if (eachKey === "fromWebsite") return null

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

                                        //link validation
                                        if (eachKey === "link") {
                                            const seenValidatedPageLink = makeValidPageLinkName(e.target.value)

                                            if (seenValidatedPageLink === "") {
                                                newFormObj[eachKey] = "/"
                                            } else {
                                                newFormObj[eachKey] = seenValidatedPageLink
                                            }
                                        }

                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, pageSchema) }}
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
                                        //@ts-expect-error type
                                        newFormObj[eachKey] = e.target.value

                                        //link validation
                                        if (eachKey === "link") {
                                            //@ts-expect-error type
                                            const seenValidatedPageLink = makeValidPageLinkName(e.target.value)

                                            if (seenValidatedPageLink === "") {
                                                newFormObj[eachKey] = "/"
                                            } else {
                                                newFormObj[eachKey] = seenValidatedPageLink
                                            }
                                        }

                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, pageSchema) }}
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
