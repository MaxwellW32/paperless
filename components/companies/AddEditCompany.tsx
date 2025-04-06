"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import TextInput from '../textInput/TextInput'
import { z } from "zod"
import { company, companySchema, newCompany, newCompanySchema, smallAdminUpdateCompanySchema, updateCompanySchema } from '@/types'
import { ensureCanAccessCompany } from '@/serverFunctions/handleAuth'
import { addCompanies, updateCompanies } from '@/serverFunctions/handleCompanies'

//admin can add/edit company
//company admin can edit company

export default function AddEditCompany({ sentCompany }: { sentCompany?: company }) {
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
                if (sentCompany === undefined) return

                const { session, accessLevel } = await ensureCanAccessCompany({ companyIdBeingAccessed: sentCompany.id })

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

    }, [sentCompany?.id])

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
            toast.success("submittting")

            //new department
            if (sentCompany === undefined) {
                const validatedNewDepartment = newCompanySchema.parse(formObj)

                //send up to server
                await addCompanies(validatedNewDepartment)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                if (localUpdateSchema === undefined) throw new Error("not seeing update schema - refresh")

                //validate
                const validatedUpdatedDepartment = localUpdateSchema.parse(formObj)

                //update
                await updateCompanies(sentCompany.id, validatedUpdatedDepartment)

                toast.success("company updated")
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
                <div className={styles.arrayCont}>
                    <label>company emails</label>

                    <div className={styles.mapCont}>
                        {formObj.emails.map((eachEmail, eachEmailIndex) => {
                            return (
                                <div key={eachEmailIndex} className={styles.mapEachCont}>
                                    <input type='text' value={eachEmail} placeholder='please enter an email'
                                        onChange={e => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.emails === undefined) return prevFormObj

                                                newFormObj.emails = newFormObj.emails.map((eachEmailMap, eachEmailMapIndex) => {
                                                    if (eachEmailMapIndex === eachEmailIndex) {
                                                        return e.target.value
                                                    }

                                                    return eachEmail
                                                })

                                                return newFormObj
                                            })
                                        }}

                                        onBlur={() => {
                                            checkIfValid(formObj, "emails", companySchema)
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <button className='button1'
                        onClick={() => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.emails === undefined) return prevFormObj

                                newFormObj.emails = [...newFormObj.emails, ""]

                                return newFormObj
                            })
                        }}
                    >add email</button>

                    {formErrors["emails"] !== undefined && (
                        <>
                            <p className='errorText'>{formErrors["emails"]}</p>
                        </>
                    )}
                </div>
            )}

            {formObj.phones !== undefined && (
                <div className={styles.arrayCont}>
                    <label>company phone numbers</label>

                    <div className={styles.mapCont}>
                        {formObj.phones.map((eachPhone, eachPhoneIndex) => {
                            return (
                                <div key={eachPhoneIndex} className={styles.mapEachCont}>
                                    <input type='text' value={eachPhone} placeholder='phone number: e.g (876)123-4567'
                                        onChange={e => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.phones === undefined) return prevFormObj

                                                newFormObj.phones = newFormObj.phones.map((eachPhoneMap, eachPhoneMapIndex) => {
                                                    if (eachPhoneMapIndex === eachPhoneIndex) {
                                                        return e.target.value
                                                    }

                                                    return eachPhone
                                                })

                                                return newFormObj
                                            })
                                        }}

                                        onBlur={() => {
                                            checkIfValid(formObj, "phones", companySchema)
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <button className='button1'
                        onClick={() => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.phones === undefined) return prevFormObj

                                newFormObj.phones = [...newFormObj.phones, ""]

                                return newFormObj
                            })
                        }}
                    >add phone number</button>

                    {formErrors["phones"] !== undefined && (
                        <>
                            <p className='errorText'>{formErrors["phones"]}</p>
                        </>
                    )}
                </div>
            )}

            {formObj.faxes !== undefined && (
                <div className={styles.arrayCont}>
                    <label>company faxes</label>

                    <div className={styles.mapCont}>
                        {formObj.faxes.map((eachFax, eachFaxIndex) => {
                            return (
                                <div key={eachFaxIndex} className={styles.mapEachCont}>
                                    <input type='text' value={eachFax} placeholder='fax number: e.g (555)123-4567'
                                        onChange={e => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.faxes === undefined) return prevFormObj

                                                newFormObj.faxes = newFormObj.faxes.map((eachFax, eachFaxMapIndex) => {
                                                    if (eachFaxMapIndex === eachFaxIndex) {
                                                        return e.target.value
                                                    }

                                                    return eachFax
                                                })

                                                return newFormObj
                                            })
                                        }}

                                        onBlur={() => {
                                            checkIfValid(formObj, "faxes", companySchema)
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <button className='button1'
                        onClick={() => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.faxes === undefined) return prevFormObj

                                newFormObj.faxes = [...newFormObj.faxes, ""]

                                return newFormObj
                            })
                        }}
                    >add fax number</button>

                    {formErrors["phones"] !== undefined && (
                        <>
                            <p className='errorText'>{formErrors["phones"]}</p>
                        </>
                    )}
                </div>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentCompany !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































