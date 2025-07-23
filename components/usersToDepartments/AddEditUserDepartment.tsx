"use client"
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import SimpleDisplayStringArray from '../reusableSimple/simpleDisplayStringArray/SimpleDisplayStringArray'
import { department, newUserToDepartment, newUserToDepartmentSchema, resourceAuthType, updateUserToDepartmentSchema, user, userDepartmentAccessLevel, userToDepartment, userToDepartmentSchema } from '@/types'
import { addUsersToDepartments, updateUsersToDepartments } from '@/serverFunctions/handleUsersToDepartments'
import { getDepartments } from '@/serverFunctions/handleDepartments'
import { getUsers } from '@/serverFunctions/handleUser'
import { ensureUserCanBeAddedToDepartment } from '@/utility/validation'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'

export default function AddEditUserDepartment({ sentUserDepartment, departmentsStarter, submissionAction }: { sentUserDepartment?: userToDepartment, departmentsStarter: department[], submissionAction?: () => void, }) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: newUserToDepartment = {
        userId: "",
        departmentId: "",
        departmentAccessLevel: "regular",
        contactNumbers: [],
        contactEmails: [],
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<userToDepartment>>(deepClone(sentUserDepartment === undefined ? initialFormObj : updateUserToDepartmentSchema.parse(sentUserDepartment)))

    type userDepartmentKeys = keyof Partial<userToDepartment>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in userDepartmentKeys]: string }>>({})

    const departmentAccessLevelOptions: userDepartmentAccessLevel[] = ["admin", "elevated", "regular"]

    const [activeUserId, activeUserIdSet] = useState<user["id"] | undefined>(undefined)
    const [users, usersSet] = useState<user[]>([])
    const [userNameSearch, userNameSearchSet] = useState("")
    const userNameSearchDebounce = useRef<NodeJS.Timeout>()

    const [activeDepartmentId, activeDepartmentIdSet] = useState<department["id"] | undefined>(undefined)
    const [departments, departmentsSet] = useState<department[]>([...departmentsStarter])


    //handle changes from above
    useEffect(() => {
        if (sentUserDepartment === undefined) return

        formObjSet(deepClone(updateUserToDepartmentSchema.parse(sentUserDepartment)))

    }, [sentUserDepartment])

    function checkIfValid(seenFormObj: Partial<userToDepartment>, seenName: keyof Partial<userToDepartment>, schema: typeof userToDepartmentSchema) {
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
            if (sentUserDepartment === undefined) {
                if (activeUserId === undefined) throw new Error("user id not seen")
                if (activeDepartmentId === undefined) throw new Error("department id not seen")

                //assign info onto object
                formObj.userId = activeUserId
                formObj.departmentId = activeDepartmentId

                const validatedNewUserToDepartment = newUserToDepartmentSchema.parse(formObj)

                //send up to server
                await addUsersToDepartments(validatedNewUserToDepartment)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

                //reset
                activeUserIdSet(undefined)
                activeDepartmentIdSet(undefined)

            } else {
                //validate
                const validatedUpdatedDepartment = updateUserToDepartmentSchema.parse(formObj)

                //update
                await updateUsersToDepartments(sentUserDepartment.id, validatedUpdatedDepartment)

                toast.success("userToDepartment updated")
            }

            //notify above that form submitted
            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            {sentUserDepartment === undefined && (
                <>
                    <label>user to add</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                        <label>search users by name</label>

                        <input type='text' placeholder='enter name to search' value={userNameSearch}
                            onChange={async (e) => {
                                try {
                                    userNameSearchSet(e.target.value)

                                    if (userNameSearchDebounce.current) clearTimeout(userNameSearchDebounce.current)

                                    userNameSearchDebounce.current = setTimeout(async () => {
                                        if (e.target.value === "") return

                                        toast.success("searching")

                                        usersSet(await getUsers({ type: "name", name: e.target.value }))
                                    }, 1000);

                                } catch (error) {
                                    consoleAndToastError(error)
                                }
                            }}
                        />

                        {users.length > 0 && (
                            <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                {users.map(eachUser => {
                                    return (
                                        <div key={eachUser.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                                            <h3>{eachUser.name}</h3>

                                            <button className='button1' style={{ backgroundColor: eachUser.id === activeUserId ? "var(--color1)" : "" }}
                                                onClick={() => {
                                                    try {
                                                        //validation
                                                        ensureUserCanBeAddedToDepartment(eachUser)

                                                        toast.success(`${eachUser.name} selected!`)

                                                        activeUserIdSet(eachUser.id)

                                                    } catch (error) {
                                                        consoleAndToastError(error)
                                                    }
                                                }}
                                            >select user</button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <label>department to add</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                        <button className='button3'
                            onClick={async () => {
                                try {
                                    if (resourceAuth === undefined) return

                                    toast.success("searching")

                                    departmentsSet(await getDepartments(resourceAuth))

                                } catch (error) {
                                    consoleAndToastError(error)
                                }
                            }}
                        >search departments</button>

                        {departments.length > 0 && (
                            <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", gridAutoFlow: "column", gridAutoColumns: "min(90%, 400px)", overflow: "auto" }} className='snap'>
                                {departments.map(eachDepartment => {
                                    return (
                                        <div key={eachDepartment.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                                            <h3>{eachDepartment.name}</h3>

                                            <button className='button1' style={{ backgroundColor: eachDepartment.id === activeDepartmentId ? "var(--color1)" : "" }}
                                                onClick={() => {
                                                    toast.success(`${eachDepartment.name} selected!`)

                                                    activeDepartmentIdSet(eachDepartment.id)
                                                }}
                                            >select</button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {formObj.departmentAccessLevel !== undefined && (
                <>
                    <label>select user access level in department</label>

                    <select value={formObj.departmentAccessLevel}
                        onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                            const eachAccessLevel = event.target.value as userDepartmentAccessLevel

                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.departmentAccessLevel === undefined) return prevFormObj

                                newFormObj.departmentAccessLevel = eachAccessLevel

                                return newFormObj
                            })
                        }}
                    >
                        {departmentAccessLevelOptions.map(eachAccessLevel => {

                            return (
                                <option key={eachAccessLevel} value={eachAccessLevel}
                                >{eachAccessLevel}</option>
                            )
                        })}
                    </select>
                </>
            )}

            {formObj.contactNumbers !== undefined && (
                <SimpleDisplayStringArray
                    keyName='contactNumbers'
                    label='user contact numbers'
                    placeholder='enter user contact numbers'
                    seenArray={formObj.contactNumbers}
                    updateFunction={(seenText, seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.contactNumbers === undefined) return prevFormObj

                            newFormObj.contactNumbers[seenIndextoUpdate] = seenText

                            return newFormObj
                        })
                    }}
                    onBlur={() => {
                        checkIfValid(formObj, "contactNumbers", userToDepartmentSchema)
                    }}
                    addFunction={() => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.contactNumbers === undefined) return prevFormObj

                            newFormObj.contactNumbers = [...newFormObj.contactNumbers, ""]

                            return newFormObj
                        })
                    }}
                    removeFunction={(seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.contactNumbers === undefined) return prevFormObj

                            newFormObj.contactNumbers = newFormObj.contactNumbers.filter((eachMailFilter, eachMailFilterIndex) => eachMailFilterIndex !== seenIndextoUpdate)

                            return newFormObj
                        })
                    }}
                    errors={formErrors["contactNumbers"]}
                />
            )}

            {formObj.contactEmails !== undefined && (
                <SimpleDisplayStringArray
                    keyName='contactEmails'
                    label='user contact emails'
                    placeholder='enter user contact emails'
                    seenArray={formObj.contactEmails}
                    updateFunction={(seenText, seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.contactEmails === undefined) return prevFormObj

                            newFormObj.contactEmails[seenIndextoUpdate] = seenText

                            return newFormObj
                        })
                    }}
                    onBlur={() => {
                        checkIfValid(formObj, "contactEmails", userToDepartmentSchema)
                    }}
                    addFunction={() => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.contactEmails === undefined) return prevFormObj

                            newFormObj.contactEmails = [...newFormObj.contactEmails, ""]

                            return newFormObj
                        })
                    }}
                    removeFunction={(seenIndextoUpdate) => {
                        formObjSet(prevFormObj => {
                            const newFormObj = { ...prevFormObj }
                            if (newFormObj.contactEmails === undefined) return prevFormObj

                            newFormObj.contactEmails = newFormObj.contactEmails.filter((eachMailFilter, eachMailFilterIndex) => eachMailFilterIndex !== seenIndextoUpdate)

                            return newFormObj
                        })
                    }}
                    errors={formErrors["contactEmails"]}
                />
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentUserDepartment !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































