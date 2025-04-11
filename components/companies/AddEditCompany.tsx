"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone, interpretAuthResponseAndError } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import TextInput from '../textInput/TextInput'
import { z } from "zod"
import { company, companySchema, newCompany, newCompanySchema, resourceAuthType, smallAdminUpdateCompanySchema, updateCompanySchema } from '@/types'
import { ensureCanAccessResource } from '@/serverFunctions/handleAuth'
import { addCompanies, updateCompanies } from '@/serverFunctions/handleCompanies'
import SimpleDisplayStringArray from '../reusableSimple/simpleDisplayStringArray/SimpleDisplayStringArray'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'

export default function AddEditCompany({ sentCompany, submissionAction }: { sentCompany?: company, submissionAction?: () => void }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const [localUpdateSchema, localUpdateSchemaSet] = useState<z.ZodSchema | undefined>()

    const initialFormObj: newCompany = {
        name: "",
        location: "",
        emails: [],
        phones: [],
        faxes: [],
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<company>>(deepClone(sentCompany === undefined ? initialFormObj : {}))

    type companyKeys = keyof Partial<company>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in companyKeys]: string }>>({})

    //get updateSchema on load
    useEffect(() => {
        const search = async () => {
            try {
                if (sentCompany === undefined || resourceAuth === undefined) return

                const authResponse = await ensureCanAccessResource({ type: "company", companyId: sentCompany.id }, resourceAuth, "u")
                const { session, accessLevel } = interpretAuthResponseAndError(authResponse)

                if (session.user.accessLevel === "admin") {
                    //app admin
                    localUpdateSchemaSet(updateCompanySchema.partial())

                } else if (accessLevel === "admin") {
                    //company admin
                    localUpdateSchemaSet(smallAdminUpdateCompanySchema.partial())
                }

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [sentCompany?.id, resourceAuth])

    //handle changes from above
    useEffect(() => {
        if (sentCompany === undefined || localUpdateSchema === undefined) return

        formObjSet(deepClone(localUpdateSchema.parse(sentCompany)))

    }, [sentCompany, localUpdateSchema])

    function checkIfValid(seenFormObj: Partial<company>, seenName: keyof Partial<company>, schema: typeof companySchema) {
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
            if (resourceAuth === undefined) throw new Error("not seeing auth")
            toast.success("submittting")

            //new department
            if (sentCompany === undefined) {
                const validatedNewDepartment = newCompanySchema.parse(formObj)

                //send up to server
                await addCompanies(validatedNewDepartment, resourceAuth)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                if (localUpdateSchema === undefined) throw new Error("not seeing update schema - refresh")

                //validate
                const validatedUpdatedDepartment = localUpdateSchema.parse(formObj)

                //update
                await updateCompanies(sentCompany.id, validatedUpdatedDepartment, resourceAuth)

                toast.success("company updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            {formObj.name !== undefined && (
                <>
                    <TextInput
                        name={"name"}
                        value={formObj.name}
                        type={"text"}
                        label={"company name"}
                        placeHolder={"enter company name"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.name === undefined) return prevFormObj

                                newFormObj.name = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "name", companySchema) }}
                        errors={formErrors["name"]}
                    />
                </>
            )}

            {formObj.location !== undefined && (
                <>
                    <TextInput
                        name={"location"}
                        value={formObj.location}
                        type={"text"}
                        label={"company location"}
                        placeHolder={"enter company location"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.location === undefined) return prevFormObj

                                newFormObj.location = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "location", companySchema) }}
                        errors={formErrors["location"]}
                    />
                </>
            )}

            {formObj.emails !== undefined && (
                <SimpleDisplayStringArray
                    keyName='emails'
                    label='company emails'
                    placeholder='enter company emails'
                    seenArray={formObj.emails}
                    updateFunction={(seenText, seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.emails === undefined) return prevFormObj

                            newFormObj.emails[seenIndextoUpdate] = seenText

                            return newFormObj
                        })
                    }}
                    onBlur={() => {
                        checkIfValid(formObj, "emails", companySchema)
                    }}
                    addFunction={() => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.emails === undefined) return prevFormObj

                            newFormObj.emails = [...newFormObj.emails, ""]

                            return newFormObj
                        })
                    }}
                    removeFunction={(seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.emails === undefined) return prevFormObj

                            newFormObj.emails = newFormObj.emails.filter((eachMailFilter, eachMailFilterIndex) => eachMailFilterIndex !== seenIndextoUpdate)

                            return newFormObj
                        })
                    }}
                    errors={formErrors["emails"]}
                />
            )}

            {formObj.phones !== undefined && (
                <SimpleDisplayStringArray
                    keyName='phones'
                    label='company phone numbers'
                    placeholder='enter company phone numbers'
                    seenArray={formObj.phones}
                    updateFunction={(seenText, seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.phones === undefined) return prevFormObj

                            newFormObj.phones[seenIndextoUpdate] = seenText

                            return newFormObj
                        })
                    }}
                    onBlur={() => {
                        checkIfValid(formObj, "phones", companySchema)
                    }}
                    addFunction={() => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.phones === undefined) return prevFormObj

                            newFormObj.phones = [...newFormObj.phones, ""]

                            return newFormObj
                        })
                    }}
                    removeFunction={(seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.phones === undefined) return prevFormObj

                            newFormObj.phones = newFormObj.phones.filter((eachMailFilter, eachMailFilterIndex) => eachMailFilterIndex !== seenIndextoUpdate)

                            return newFormObj
                        })
                    }}
                    errors={formErrors["phones"]}
                />
            )}

            {formObj.faxes !== undefined && (
                <SimpleDisplayStringArray
                    keyName='faxes'
                    label='company faxes'
                    placeholder='enter company faxes'
                    seenArray={formObj.faxes}
                    updateFunction={(seenText, seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.faxes === undefined) return prevFormObj

                            newFormObj.faxes[seenIndextoUpdate] = seenText

                            return newFormObj
                        })
                    }}
                    onBlur={() => {
                        checkIfValid(formObj, "faxes", companySchema)
                    }}
                    addFunction={() => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.faxes === undefined) return prevFormObj

                            newFormObj.faxes = [...newFormObj.faxes, ""]

                            return newFormObj
                        })
                    }}
                    removeFunction={(seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.faxes === undefined) return prevFormObj

                            newFormObj.faxes = newFormObj.faxes.filter((eachMailFilter, eachMailFilterIndex) => eachMailFilterIndex !== seenIndextoUpdate)

                            return newFormObj
                        })
                    }}
                    errors={formErrors["faxes"]}
                />
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentCompany !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































