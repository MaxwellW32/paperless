"use client"
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import { deepClone } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import SimpleDisplayStringArray from '../reusableSimple/simpleDisplayStringArray/SimpleDisplayStringArray'
import { getUsers } from '@/serverFunctions/handleUser'
import { company, companyAccessLevel, newUserToCompany, newUserToCompanySchema, updateUserToCompanySchema, user, userToCompany, userToCompanySchema } from '@/types'
import { addUsersToCompanies, updateUsersToCompanies } from '@/serverFunctions/handleUsersToCompanies'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import { ensureUserCanBeAddedToCompany } from '@/utility/validation'

export default function AddEditUserCompany({ sentUserCompany, companiesStarter, submissionFunction }: { sentUserCompany?: userToCompany, companiesStarter: company[], submissionFunction?: () => void }) {
    const initialFormObj: newUserToCompany = {
        userId: "",
        companyId: "",
        companyAccessLevel: "regular",
        onAccessList: false,
        contactNumbers: [],
        contactEmails: [],
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<userToCompany>>(deepClone(sentUserCompany === undefined ? initialFormObj : updateUserToCompanySchema.parse(sentUserCompany)))

    type userCompanyKeys = keyof Partial<userToCompany>
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in userCompanyKeys]: string }>>({})

    const companyAccessLevelOptions: companyAccessLevel[] = ["admin", "elevated", "regular"]

    const [activeUserId, activeUserIdSet] = useState<user["id"] | undefined>(undefined)
    const [users, usersSet] = useState<user[]>([])
    const [userNameSearch, userNameSearchSet] = useState("")
    const userNameSearchDebounce = useRef<NodeJS.Timeout>()

    const [activeCompanyId, activeCompanyIdSet] = useState<company["id"] | undefined>(undefined)
    const [companies, companiesSet] = useState<company[]>([...companiesStarter])

    //handle changes from above
    useEffect(() => {
        if (sentUserCompany === undefined) return

        formObjSet(deepClone(updateUserToCompanySchema.parse(sentUserCompany)))

    }, [sentUserCompany])

    function checkIfValid(seenFormObj: Partial<userToCompany>, seenName: keyof Partial<userToCompany>, schema: typeof userToCompanySchema) {
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

            //new company
            if (sentUserCompany === undefined) {
                if (activeUserId === undefined) throw new Error("user id not seen")
                if (activeCompanyId === undefined) throw new Error("company id not seen")

                //assign info onto object
                formObj.userId = activeUserId
                formObj.companyId = activeCompanyId

                const validatedNewUserToCompany = newUserToCompanySchema.parse(formObj)

                //send up to server
                await addUsersToCompanies(validatedNewUserToCompany)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

                //reset
                activeUserIdSet(undefined)
                activeCompanyIdSet(undefined)

            } else {
                //validate
                const validatedUpdatedCompany = updateUserToCompanySchema.parse(formObj)

                //update
                await updateUsersToCompanies(sentUserCompany.id, validatedUpdatedCompany)

                toast.success("userToCompany updated")
            }

            //notify above that form submitted
            if (submissionFunction !== undefined) {
                submissionFunction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            {sentUserCompany === undefined && (
                <>
                    <label>user to add</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
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
                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                {users.map(eachUser => {
                                    return (
                                        <div key={eachUser.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <h3>{eachUser.name}</h3>

                                            <button className='button1' style={{ backgroundColor: eachUser.id === activeUserId ? "rgb(var(--color1))" : "" }}
                                                onClick={() => {
                                                    try {
                                                        //validation
                                                        ensureUserCanBeAddedToCompany(eachUser)

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

                    <label>company to add</label>

                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                        <button className='button3'
                            onClick={async () => {
                                try {
                                    toast.success("searching")

                                    companiesSet(await getCompanies())

                                } catch (error) {
                                    consoleAndToastError(error)
                                }
                            }}
                        >search companies</button>

                        {companies.length > 0 && (
                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", gridAutoFlow: "column", gridAutoColumns: "400px", overflow: "auto" }} className='snap'>
                                {companies.map(eachCompany => {
                                    return (
                                        <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                            <h3>{eachCompany.name}</h3>

                                            <button className='button1' style={{ backgroundColor: eachCompany.id === activeCompanyId ? "rgb(var(--color1))" : "" }}
                                                onClick={() => {
                                                    toast.success(`${eachCompany.name} selected!`)

                                                    activeCompanyIdSet(eachCompany.id)
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

            {formObj.companyAccessLevel !== undefined && (
                <>
                    <label>select user access level in company</label>

                    <select value={formObj.companyAccessLevel}
                        onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                            const eachAccessLevel = event.target.value as companyAccessLevel

                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.companyAccessLevel === undefined) return prevFormObj

                                newFormObj.companyAccessLevel = eachAccessLevel

                                return newFormObj
                            })
                        }}
                    >
                        {companyAccessLevelOptions.map(eachAccessLevel => {

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
                        checkIfValid(formObj, "contactNumbers", userToCompanySchema)
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
                        checkIfValid(formObj, "contactEmails", userToCompanySchema)
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

            {formObj.onAccessList !== undefined && (
                <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                    <label>can company user visit site?</label>

                    <button className='button1'
                        onClick={() => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.onAccessList === undefined) return prevFormObj

                                newFormObj.onAccessList = !newFormObj.onAccessList

                                return newFormObj
                            })
                        }}
                    >{formObj.onAccessList ? "can visit" : "can't visit"}</button>

                    {formErrors["onAccessList"] !== undefined && (
                        <>
                            <p className='errorText'>{formErrors["onAccessList"]}</p>
                        </>
                    )}
                </div>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentUserCompany !== undefined ? "update" : "submit"}</button>
        </form>
    )
}













































