"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import TextInput from '../textInput/TextInput'
import { newUser, newUserSchema, updateUserSchema, user, userAccessLevel, userSchema } from '@/types'
import { addUsers, updateUsers } from '@/serverFunctions/handleUser'
import Image from 'next/image'

export default function AddEditUser({ sentUser, submissionAction }: { sentUser?: user, submissionAction?: () => void }) {
    const initialFormObj: newUser = {
        fromDepartment: false,
        accessLevel: null,
        name: "",
        image: "",
        email: "",
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<user>>(deepClone(sentUser === undefined ? initialFormObj : updateUserSchema.parse(sentUser)))

    type userKeys = keyof Partial<user>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in userKeys]: string }>>({})
    const [defaultImages, defaultImagesSet] = useState<string[]>([])

    const userAccessLevelOptions: userAccessLevel[] = ["admin"]

    //handle changes from above
    useEffect(() => {
        if (sentUser === undefined) return

        formObjSet(deepClone(updateUserSchema.parse(sentUser)))

    }, [sentUser])

    function checkIfValid(seenFormObj: Partial<user>, seenName: keyof Partial<user>, schema: typeof userSchema) {
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
            if (sentUser === undefined) {
                const validatedNewUser = newUserSchema.parse(formObj)

                //send up to server
                await addUsers(validatedNewUser)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedUser = updateUserSchema.parse(formObj)

                //update
                await updateUsers(sentUser.id, validatedUpdatedUser)

                toast.success("user updated")
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
                        value={formObj.name !== null ? formObj.name : ""}
                        type={"text"}
                        label={"user name"}
                        placeHolder={"enter user name"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.name === undefined) return prevFormObj

                                newFormObj.name = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "name", userSchema) }}
                        errors={formErrors["name"]}
                    />
                </>
            )}

            {formObj.fromDepartment !== undefined && (
                <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                    <label>user from department or a client?</label>

                    <button className='button1'
                        onClick={() => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.fromDepartment === undefined) return prevFormObj

                                newFormObj.fromDepartment = !newFormObj.fromDepartment

                                return newFormObj
                            })
                        }}
                    >{formObj.fromDepartment ? "department" : "client"}</button>

                    {formErrors["fromDepartment"] !== undefined && (
                        <>
                            <p className='errorText'>{formErrors["fromDepartment"]}</p>
                        </>
                    )}
                </div>
            )}

            {formObj.accessLevel !== undefined && (
                <>
                    <label>select user access level</label>

                    <select value={formObj.accessLevel !== null ? formObj.accessLevel : ""}
                        onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                            const eachAccessLevel = event.target.value as (userAccessLevel | "null")

                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.accessLevel === undefined) return prevFormObj

                                newFormObj.accessLevel = eachAccessLevel === "null" ? null : eachAccessLevel

                                return newFormObj
                            })
                        }}
                    >
                        <option value={"null"}
                        >null</option>

                        {userAccessLevelOptions.map(eachAccessLevel => {

                            return (
                                <option key={eachAccessLevel} value={eachAccessLevel}
                                >{eachAccessLevel}</option>
                            )
                        })}
                    </select>
                </>
            )}

            {formObj.email !== undefined && (
                <>
                    <TextInput
                        name={"email"}
                        value={formObj.email !== null ? formObj.email : ""}
                        type={"text"}
                        label={"user email"}
                        placeHolder={"enter email user will sign in with"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.email === undefined) return prevFormObj

                                newFormObj.email = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "email", userSchema) }}
                        errors={formErrors["email"]}
                    />
                </>
            )}

            {formObj.image !== undefined && (
                <>
                    <button className='button3'
                        onClick={async () => {
                            try {
                                const response = await fetch(`/api/defaultImages`)
                                const seenImages = await response.json()

                                defaultImagesSet(seenImages)

                            } catch (error) {
                                consoleAndToastError(error)
                            }
                        }}
                    >search default Images</button>

                    {defaultImages.length > 0 && (
                        <div style={{ display: "flex", gap: "1rem", overflow: "auto" }} className='snap'>
                            {defaultImages.map(eachImage => {
                                const fullUrl = `/defaultImages/${eachImage}`
                                return (
                                    <button key={eachImage} style={{ flex: "0 0 auto" }}
                                        onClick={() => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.image === undefined) return prevFormObj

                                                newFormObj.image = fullUrl

                                                return newFormObj
                                            })
                                        }}
                                    >
                                        <Image alt='default image' src={fullUrl} width={50} height={50} style={{ objectFit: "contain" }} />
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <TextInput
                        name={"image"}
                        value={formObj.image !== null ? formObj.image : ""}
                        type={"text"}
                        label={"user image"}
                        placeHolder={"enter image for user"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.image === undefined) return prevFormObj

                                newFormObj.image = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "image", userSchema) }}
                        errors={formErrors["image"]}
                    />

                    {formObj.image !== "" && formObj.image !== null && (
                        <>
                            <label>selected image</label>

                            <Image alt='default image' src={formObj.image} width={50} height={50} style={{ objectFit: "contain" }} />
                        </>
                    )}
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentUser !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































