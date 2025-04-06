"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { department, departmentSchema, newDepartment, newDepartmentSchema, smallAdminUpdateDepartmentSchema, updateDepartmentSchema } from '@/types'
import { addDepartments, updateDepartments } from '@/serverFunctions/handleDepartments'
import TextInput from '../textInput/TextInput'
import { ensureCanAccessDepartment } from '@/serverFunctions/handleAuth'
import { z } from "zod"

export default function AddEditDepartment({ sentDepartment }: { sentDepartment?: department }) {
    const [localUpdateSchema, localUpdateSchemaSet] = useState<z.ZodSchema | undefined>()

    const initialFormObj: newDepartment = {
        name: "",
        emails: [],
        phones: [],
        canManageRequests: false,
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<department>>(deepClone(sentDepartment === undefined ? initialFormObj : {}))

    type departmentKeys = keyof Partial<department>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in departmentKeys]: string }>>({})

    //get updateSchema on load
    useEffect(() => {
        const search = async () => {
            try {
                if (sentDepartment === undefined) return

                const { session, accessLevel } = await ensureCanAccessDepartment({ departmentIdBeingAccessed: sentDepartment.id })

                if (session.user.accessLevel === "admin") {
                    //app admin
                    localUpdateSchemaSet(updateDepartmentSchema.partial())

                } else if (accessLevel === "admin") {
                    //department admin
                    localUpdateSchemaSet(smallAdminUpdateDepartmentSchema.partial())
                }

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [sentDepartment?.id])

    //handle changes from above
    useEffect(() => {
        if (sentDepartment === undefined || localUpdateSchema === undefined) return

        formObjSet(deepClone(localUpdateSchema.parse(sentDepartment)))

    }, [sentDepartment, localUpdateSchema])

    function checkIfValid(seenFormObj: Partial<department>, seenName: keyof Partial<department>, schema: typeof departmentSchema) {
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
            if (sentDepartment === undefined) {
                const validatedNewDepartment = newDepartmentSchema.parse(formObj)

                //send up to server
                await addDepartments(validatedNewDepartment)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                if (localUpdateSchema === undefined) throw new Error("not seeing update schema - refresh")

                //validate
                const validatedUpdatedDepartment = localUpdateSchema.parse(formObj)

                //update
                await updateDepartments(sentDepartment.id, validatedUpdatedDepartment)

                toast.success("department updated")
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
                        label={"department name"}
                        placeHolder={"enter department name"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.name === undefined) return prevFormObj

                                newFormObj.name = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "name", departmentSchema) }}
                        errors={formErrors["name"]}
                    />
                </>
            )}

            {formObj.emails !== undefined && (
                <div className={styles.arrayCont}>
                    <label>department emails</label>

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
                                            checkIfValid(formObj, "emails", departmentSchema)
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
                    <label>department phone numbers</label>

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
                                            checkIfValid(formObj, "phones", departmentSchema)
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

            {formObj.canManageRequests !== undefined && (
                <div className={styles.arrayCont}>
                    <label>can department manage client requests?</label>

                    <button className='button1'
                        onClick={() => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.canManageRequests === undefined) return prevFormObj

                                newFormObj.canManageRequests = !newFormObj.canManageRequests

                                return newFormObj
                            })
                        }}
                    >{formObj.canManageRequests ? "can manage" : "can't manage"}</button>

                    {formErrors["canManageRequests"] !== undefined && (
                        <>
                            <p className='errorText'>{formErrors["canManageRequests"]}</p>
                        </>
                    )}
                </div>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentDepartment !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































