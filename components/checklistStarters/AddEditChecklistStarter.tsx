"use client"
import React, { HTMLAttributes, useEffect, useState } from 'react'
import styles from "./style.module.css"
import { deepClone, moveItemInArray } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import toast from 'react-hot-toast'
import { checklistItemType, checklistStarter, company, department, newChecklistStarter, newChecklistStarterSchema, formTypesType, updateChecklistStarterSchema, dynamicFormType, checklistStarterSchema, resourceAuthType } from '@/types'
import { addChecklistStarters, updateChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import { getDepartments } from '@/serverFunctions/handleDepartments'
import { getCompanies } from '@/serverFunctions/handleCompanies'
import ShowMore from '../showMore/ShowMore'
import { MakeDynamicForm } from '../makeReadDynamicChecklistForm/DynamicForm'
import TextInput from '../textInput/TextInput'
import { useAtom } from 'jotai'
import { resourceAuthGlobal } from '@/utility/globalState'

export default function AddEditChecklistStarter({ sentChecklistStarter, submissionAction, ...elProps }: { sentChecklistStarter?: checklistStarter, submissionAction?: () => void } & HTMLAttributes<HTMLFormElement>) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const initialFormObj: newChecklistStarter = {
        type: "",
        checklist: []
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<checklistStarter>>(deepClone(sentChecklistStarter !== undefined ? updateChecklistStarterSchema.parse(sentChecklistStarter) : initialFormObj))

    type checklistStarterKeys = keyof checklistStarter
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in checklistStarterKeys]: string }>>({})

    const premadeFormTypeOptions: formTypesType[] = ["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "dynamic"]
    const checklistTypeOptions: checklistItemType["type"][] = ["form", "email", "manual"]

    const [departments, departmentsSet] = useState<department[]>([])
    const [companies, companiesSet] = useState<company[]>([])

    //handle changes from aboe
    useEffect(() => {
        if (sentChecklistStarter === undefined) return

        formObjSet(deepClone(updateChecklistStarterSchema.parse(sentChecklistStarter)))

    }, [sentChecklistStarter])

    function checkIfValid(seenFormObj: Partial<checklistStarter>, seenName: keyof Partial<checklistStarter>, schema: typeof checklistStarterSchema) {
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
            if (sentChecklistStarter === undefined) {
                //make new checklist starter

                //validate
                const validatedNewChecklistStarter: newChecklistStarter = newChecklistStarterSchema.parse(formObj)

                //send up to server
                await addChecklistStarters(validatedNewChecklistStarter)

                toast.success("checklist starter added")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedChecklistStarter = updateChecklistStarterSchema.parse(formObj)

                //update
                updateChecklistStarters(sentChecklistStarter.id, validatedUpdatedChecklistStarter)

                toast.success("checklist starter updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function updateChecklist(sentChecklist: checklistItemType[]) {
        formObjSet(prevFormObj => {
            const newFormObj = { ...prevFormObj }

            newFormObj.checklist = [...sentChecklist]

            return newFormObj
        })
    }

    async function handleGetCompanies() {
        try {
            if (resourceAuth === undefined) throw new Error("not seeing auth")

            toast.success("searching")

            companiesSet(await getCompanies(resourceAuth))

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function AddOptions({ indexToAdd }: { indexToAdd?: number }) {
        return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingR)" }}>
                {checklistTypeOptions.map(eachOption => {
                    return (
                        <button key={eachOption} className='button1'
                            onClick={() => {
                                if (formObj.checklist === undefined) return

                                const newChecklistItem: checklistItemType | null =
                                    eachOption === "form" ? {
                                        type: "form",
                                        form: {
                                            type: "dynamic",
                                            data: {}
                                        },
                                        completed: false
                                    } :
                                        eachOption === "email" ? {
                                            type: "email",
                                            to: "",
                                            subject: "",
                                            email: "",
                                            completed: false
                                        } :
                                            eachOption === "manual" ? {
                                                type: "manual",
                                                for: {
                                                    type: "department",
                                                    departmenId: ""
                                                },
                                                prompt: "",
                                                completed: false
                                            } : null

                                if (newChecklistItem === null) return

                                //add at correct position
                                const newChecklist = indexToAdd === undefined ? [...formObj.checklist, newChecklistItem] : [
                                    ...formObj.checklist.slice(0, indexToAdd),
                                    newChecklistItem,
                                    ...formObj.checklist.slice(indexToAdd),
                                ];

                                updateChecklist(newChecklist)
                            }}
                        >add {eachOption}</button>
                    )
                })}
            </div>

        )
    }

    return (
        <form {...elProps} className={styles.form} action={() => { }}>
            {formObj.type !== undefined && (
                <>
                    <TextInput
                        name={"type"}
                        value={formObj.type}
                        type={"text"}
                        label={"type"}
                        placeHolder={"request type client will select"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.type === undefined) return prevFormObj

                                newFormObj.type = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "type", checklistStarterSchema) }}
                        errors={formErrors["type"]}
                    />
                </>
            )}

            {formObj.checklist !== undefined && (
                <>
                    {formObj.checklist.length > 0 ? (
                        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                            {formObj.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                                let foundDepartment: department | undefined = undefined

                                if (eachChecklistItem.type === "manual" && eachChecklistItem.for.type === "department" && departments.length > 0) {
                                    foundDepartment = departments.find(eachDepartment => eachChecklistItem.for.type === "department" && eachDepartment.id === eachChecklistItem.for.departmenId)
                                }

                                return (
                                    <div key={eachChecklistItemIndex} className={styles.eachchecklistStarter}>
                                        <ConfirmationBox text='remove' confirmationText='are you sure you want to remove?' successMessage='removed!'
                                            buttonProps={{
                                                style: {
                                                    justifySelf: "flex-end"
                                                }
                                            }}
                                            runAction={async () => {
                                                if (formObj.checklist === undefined) return

                                                const newChecklist = formObj.checklist.filter((eachChecklistFilter, eachChecklistFilterIndex) => eachChecklistFilterIndex !== eachChecklistItemIndex)

                                                updateChecklist(newChecklist)
                                            }}
                                        />

                                        <label>{eachChecklistItem.type}</label>

                                        {eachChecklistItem.type === "form" && (
                                            <>
                                                <label>select form type</label>

                                                <select defaultValue={""}
                                                    onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                                        if (event.target.value === "") return
                                                        if (formObj.checklist === undefined) return

                                                        const eachFormType = event.target.value as formTypesType

                                                        //edit new checklist item
                                                        const newChecklistItem = { ...eachChecklistItem }

                                                        //update form type
                                                        newChecklistItem.form.type = eachFormType

                                                        if (newChecklistItem.form.type === "dynamic") {
                                                            const newDynamicFormData: dynamicFormType["data"] = {}

                                                            newChecklistItem.form.data = newDynamicFormData

                                                            //set to null as starting value
                                                        } else {
                                                            newChecklistItem.form.data = null
                                                        }

                                                        //edit new checklist at index
                                                        const newChecklist = [...formObj.checklist]
                                                        newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                        updateChecklist(newChecklist)
                                                    }}
                                                >
                                                    <option value={""}
                                                    >select</option>

                                                    {premadeFormTypeOptions.map(eachFormType => {

                                                        return (
                                                            <option key={eachFormType} value={eachFormType}
                                                            >{eachFormType}</option>
                                                        )
                                                    })}
                                                </select>

                                                <label>{eachChecklistItem.form.type} form selected</label>

                                                {eachChecklistItem.form.type === "dynamic" && (
                                                    <MakeDynamicForm seenForm={eachChecklistItem.form.data}
                                                        handleFormUpdate={(seenLatestForm) => {
                                                            if (formObj.checklist === undefined) return

                                                            //edit new checklist item
                                                            const newChecklistItem = { ...eachChecklistItem }
                                                            if (newChecklistItem.form.type !== "dynamic") return

                                                            newChecklistItem.form.data = seenLatestForm

                                                            //edit new checklist at index
                                                            const newChecklist = [...formObj.checklist]
                                                            newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                            updateChecklist(newChecklist)
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}

                                        {eachChecklistItem.type === "email" && (
                                            <>
                                                <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingR)" }}>

                                                        <button className='button1'
                                                            onClick={handleGetCompanies}
                                                        >companies</button>

                                                        <button className='button1'
                                                            onClick={async () => {
                                                                if (resourceAuth === undefined) return

                                                                toast.success("searching")
                                                                const seenDepartments = await getDepartments(resourceAuth)

                                                                departmentsSet(seenDepartments)
                                                            }}
                                                        >departments</button>
                                                    </div>

                                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", }}>
                                                        {companies.length > 0 && (
                                                            <>
                                                                <ShowMore
                                                                    label='companies'
                                                                    content={
                                                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", gridAutoFlow: "column", gridAutoColumns: "min(100%, 250px)", overflow: "auto" }} className='snap'>
                                                                            {companies.map(eachCompany => {
                                                                                return (
                                                                                    <div key={eachCompany.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", backgroundColor: "var(--color3)", padding: "var(--spacingR)" }}>
                                                                                        <h3>{eachCompany.name}</h3>

                                                                                        {eachCompany.emails.length > 0 && (
                                                                                            <>
                                                                                                <h3>company emails</h3>

                                                                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingS)" }}>
                                                                                                    {eachCompany.emails.map((eachCompanyEmail, eachCompanyEmailIndex) => {
                                                                                                        return (
                                                                                                            <button key={eachCompanyEmailIndex} className='button3'
                                                                                                                onClick={() => {
                                                                                                                    if (formObj.checklist === undefined) return

                                                                                                                    //edit new checklist item
                                                                                                                    const newChecklistItem = { ...eachChecklistItem }
                                                                                                                    newChecklistItem.to = eachCompanyEmail

                                                                                                                    //edit new checklist at index
                                                                                                                    const newChecklist = [...formObj.checklist]
                                                                                                                    newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                                                                    updateChecklist(newChecklist)
                                                                                                                }}
                                                                                                            >{eachCompanyEmail}</button>
                                                                                                        )
                                                                                                    })}
                                                                                                </div>
                                                                                            </>
                                                                                        )
                                                                                        }

                                                                                        {
                                                                                            eachCompany.usersToCompanies !== undefined && eachCompany.usersToCompanies.length > 0 && (
                                                                                                <>
                                                                                                    <p>company user emails:</p>

                                                                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingS)" }}>
                                                                                                        {eachCompany.usersToCompanies.map(eachUserCompany => {
                                                                                                            if (eachUserCompany.user === undefined) return null

                                                                                                            return (
                                                                                                                <div key={eachUserCompany.id}>
                                                                                                                    <h3>{eachUserCompany.user.name}</h3>

                                                                                                                    {eachUserCompany.contactEmails.length > 0 && (
                                                                                                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                                                                                                            {eachUserCompany.contactEmails.map((eachContactEmail, eachContactEmailIndex) => {
                                                                                                                                return (
                                                                                                                                    <button key={eachContactEmailIndex} className='button3'
                                                                                                                                        onClick={() => {
                                                                                                                                            if (formObj.checklist === undefined) return

                                                                                                                                            //edit new checklist item
                                                                                                                                            const newChecklistItem = { ...eachChecklistItem }
                                                                                                                                            newChecklistItem.to = eachContactEmail

                                                                                                                                            //edit new checklist at index
                                                                                                                                            const newChecklist = [...formObj.checklist]
                                                                                                                                            newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                                                                                            updateChecklist(newChecklist)
                                                                                                                                        }}
                                                                                                                                    >{eachContactEmail}</button>
                                                                                                                                )
                                                                                                                            })}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            )
                                                                                                        })}
                                                                                                    </div>
                                                                                                </>
                                                                                            )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    }
                                                                />
                                                            </>
                                                        )}

                                                        {departments.length > 0 && (
                                                            <>
                                                                <ShowMore
                                                                    label='departments'
                                                                    content={
                                                                        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", gridAutoFlow: "column", gridAutoColumns: "min(100%, 250px)", overflow: "auto" }} className='snap'>
                                                                            {departments.map(eachDepartment => {
                                                                                return (
                                                                                    <div key={eachDepartment.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", backgroundColor: "var(--color3)", padding: "var(--spacingR)" }}>
                                                                                        <h3>{eachDepartment.name}</h3>

                                                                                        {eachDepartment.emails.length > 0 && (
                                                                                            <>
                                                                                                <h3>department emails: </h3>

                                                                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingS)", overflow: "auto" }}>
                                                                                                    {eachDepartment.emails.map((eachDepartmentEmail, eachDepartmentEmailIndex) => {
                                                                                                        return (
                                                                                                            <button key={eachDepartmentEmailIndex} className='button3'
                                                                                                                onClick={() => {
                                                                                                                    if (formObj.checklist === undefined) return

                                                                                                                    //edit new checklist item
                                                                                                                    const newChecklistItem = { ...eachChecklistItem }
                                                                                                                    newChecklistItem.to = eachDepartmentEmail

                                                                                                                    //edit new checklist at index
                                                                                                                    const newChecklist = [...formObj.checklist]
                                                                                                                    newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                                                                    updateChecklist(newChecklist)
                                                                                                                }}
                                                                                                            >{eachDepartmentEmail}</button>
                                                                                                        )
                                                                                                    })}
                                                                                                </div>
                                                                                            </>
                                                                                        )
                                                                                        }

                                                                                        {
                                                                                            eachDepartment.usersToDepartments !== undefined && eachDepartment.usersToDepartments.length > 0 && (
                                                                                                <>
                                                                                                    <h3>department user emails:</h3>

                                                                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingS)", overflow: "auto" }}>
                                                                                                        {eachDepartment.usersToDepartments.map(eachUserDepartment => {
                                                                                                            if (eachUserDepartment.user === undefined) return null

                                                                                                            return (
                                                                                                                <div key={eachUserDepartment.id}>
                                                                                                                    <p>{eachUserDepartment.user.name}</p>

                                                                                                                    {eachUserDepartment.contactEmails.length > 0 && (
                                                                                                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                                                                                                            {eachUserDepartment.contactEmails.map((eachContactEmail, eachContactEmailIndex) => {
                                                                                                                                return (
                                                                                                                                    <button key={eachContactEmailIndex} className='button3'
                                                                                                                                        onClick={() => {
                                                                                                                                            if (formObj.checklist === undefined) return

                                                                                                                                            //edit new checklist item
                                                                                                                                            const newChecklistItem = { ...eachChecklistItem }
                                                                                                                                            newChecklistItem.to = eachContactEmail

                                                                                                                                            //edit new checklist at index
                                                                                                                                            const newChecklist = [...formObj.checklist]
                                                                                                                                            newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                                                                                            updateChecklist(newChecklist)
                                                                                                                                        }}
                                                                                                                                    >{eachContactEmail}</button>
                                                                                                                                )
                                                                                                                            })}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            )
                                                                                                        })}
                                                                                                    </div>
                                                                                                </>
                                                                                            )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    }
                                                                />
                                                            </>
                                                        )
                                                        }
                                                    </div>
                                                </div>

                                                <label>to: </label>

                                                <input type='text' value={eachChecklistItem.to} placeholder='Enter send to'
                                                    onChange={(e) => {
                                                        if (formObj.checklist === undefined) return

                                                        //edit new checklist item
                                                        const newChecklistItem = { ...eachChecklistItem }
                                                        newChecklistItem.to = e.target.value

                                                        //edit new checklist at index
                                                        const newChecklist = [...formObj.checklist]
                                                        newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                        updateChecklist(newChecklist)
                                                    }}
                                                />

                                                <label>subject: </label>

                                                <input type='text' value={eachChecklistItem.subject} placeholder='Enter email subject'
                                                    onChange={(e) => {
                                                        if (formObj.checklist === undefined) return

                                                        //edit new checklist item
                                                        const newChecklistItem = { ...eachChecklistItem }
                                                        newChecklistItem.subject = e.target.value

                                                        //edit new checklist at index
                                                        const newChecklist = [...formObj.checklist]
                                                        newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                        updateChecklist(newChecklist)
                                                    }}
                                                />

                                                <label>Email Html: </label>

                                                <textarea rows={5} value={eachChecklistItem.email} placeholder='Enter email to send'
                                                    onChange={(e) => {
                                                        if (formObj.checklist === undefined) return

                                                        //edit new checklist item
                                                        const newChecklistItem = { ...eachChecklistItem }
                                                        newChecklistItem.email = e.target.value

                                                        //edit new checklist at index
                                                        const newChecklist = [...formObj.checklist]
                                                        newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                        updateChecklist(newChecklist)
                                                    }}
                                                />

                                                <button className='button2' style={{ justifySelf: "flex-start" }}
                                                    onClick={async () => {
                                                        if (formObj.checklist === undefined) return

                                                        const response = await fetch(`/starterEmail.html`)
                                                        const seenEmail = await response.text()

                                                        //edit new checklist item
                                                        const newChecklistItem = { ...eachChecklistItem }
                                                        newChecklistItem.email = seenEmail

                                                        //edit new checklist at index
                                                        const newChecklist = [...formObj.checklist]
                                                        newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                        updateChecklist(newChecklist)
                                                    }}
                                                >use default html</button>
                                            </>
                                        )
                                        }

                                        {
                                            eachChecklistItem.type === "manual" && (
                                                <>
                                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingR)" }}>
                                                            <button className='button1' style={{ backgroundColor: eachChecklistItem.for.type === "client" ? "var(--color1)" : "" }}
                                                                onClick={async () => {
                                                                    if (formObj.checklist === undefined) return

                                                                    //edit new checklist item
                                                                    const newChecklistItem = { ...eachChecklistItem }
                                                                    newChecklistItem.for = {
                                                                        type: "client",
                                                                    }

                                                                    //edit new checklist at index
                                                                    const newChecklist = [...formObj.checklist]
                                                                    newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                    toast.success(`set for client`)

                                                                    updateChecklist(newChecklist)
                                                                }}
                                                            >client</button>

                                                            <button className='button1' style={{ backgroundColor: eachChecklistItem.for.type === "department" ? "var(--color1)" : "" }}
                                                                onClick={async () => {
                                                                    if (formObj.checklist === undefined) return

                                                                    //edit new checklist item
                                                                    const newChecklistItem = { ...eachChecklistItem }
                                                                    newChecklistItem.for = {
                                                                        type: "department",
                                                                        departmenId: ""
                                                                    }

                                                                    //edit new checklist at index
                                                                    const newChecklist = [...formObj.checklist]
                                                                    newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                    toast.success(`set for department`)

                                                                    updateChecklist(newChecklist)
                                                                }}
                                                            >department</button>
                                                        </div>

                                                        {eachChecklistItem.for.type === "department" && (
                                                            <>
                                                                <button className='button3'
                                                                    onClick={async () => {
                                                                        if (resourceAuth === undefined) return

                                                                        toast.success("searching")
                                                                        const seenDepartments = await getDepartments(resourceAuth)

                                                                        departmentsSet(seenDepartments)
                                                                    }}
                                                                >load departments</button>

                                                                <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", }}>
                                                                    {departments.length > 0 && (
                                                                        <>
                                                                            <ShowMore
                                                                                label='departments'
                                                                                content={
                                                                                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", gridAutoFlow: "column", gridAutoColumns: "min(100%, 250px)", overflow: "auto" }} className='snap'>
                                                                                        {departments.map(eachDepartment => {
                                                                                            return (
                                                                                                <div key={eachDepartment.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", backgroundColor: "var(--color3)", padding: "var(--spacingR)" }}>
                                                                                                    <h3>{eachDepartment.name}</h3>

                                                                                                    <button className='button1'
                                                                                                        onClick={() => {
                                                                                                            if (formObj.checklist === undefined) return

                                                                                                            //edit new checklist item
                                                                                                            const newChecklistItem = { ...eachChecklistItem }
                                                                                                            newChecklistItem.for = {
                                                                                                                type: "department",
                                                                                                                departmenId: eachDepartment.id
                                                                                                            }

                                                                                                            //edit new checklist at index
                                                                                                            const newChecklist = [...formObj.checklist]
                                                                                                            newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                                                                            toast.success(`set for ${eachDepartment.name}`)

                                                                                                            updateChecklist(newChecklist)
                                                                                                        }}
                                                                                                    >add</button>
                                                                                                </div>
                                                                                            )
                                                                                        })}
                                                                                    </div>
                                                                                }
                                                                            />
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}

                                                        {(eachChecklistItem.for.type === "department" && eachChecklistItem.for.departmenId !== "") && (
                                                            <h3>manual check set for {eachChecklistItem.for.type}: {foundDepartment !== undefined && foundDepartment.name}</h3>
                                                        )}

                                                        {eachChecklistItem.for.type === "client" && (
                                                            <h3>manual check set for client</h3>
                                                        )}
                                                    </div>

                                                    <input type='text' value={eachChecklistItem.prompt} placeholder='Enter prompt to ask user'
                                                        onChange={(e) => {
                                                            if (formObj.checklist === undefined) return

                                                            //edit new checklist item
                                                            const newChecklistItem = { ...eachChecklistItem }
                                                            newChecklistItem.prompt = e.target.value

                                                            //edit new checklist at index
                                                            const newChecklist = [...formObj.checklist]
                                                            newChecklist[eachChecklistItemIndex] = newChecklistItem

                                                            updateChecklist(newChecklist)
                                                        }}
                                                    />
                                                </>
                                            )
                                        }

                                        <div className={styles.moveButtonCont}>
                                            <AddOptions indexToAdd={eachChecklistItemIndex + 1} />

                                            <button className='button2'
                                                onClick={() => {
                                                    if (formObj.checklist === undefined) return

                                                    let nextIndex = eachChecklistItemIndex + 1
                                                    if (nextIndex > formObj.checklist.length - 1) {
                                                        nextIndex = 0
                                                    }

                                                    const updatedChecklist = moveItemInArray(formObj.checklist, eachChecklistItemIndex, nextIndex)

                                                    updateChecklist(updatedChecklist)
                                                }}
                                            >down</button>

                                            <button className='button2'
                                                onClick={() => {
                                                    if (formObj.checklist === undefined) return

                                                    let prevIndex = eachChecklistItemIndex - 1
                                                    if (prevIndex < 0) {
                                                        prevIndex = formObj.checklist.length - 1
                                                    }

                                                    const updatedChecklist = moveItemInArray(formObj.checklist, eachChecklistItemIndex, prevIndex)

                                                    updateChecklist(updatedChecklist)
                                                }}
                                            >up</button>
                                        </div>
                                    </div >
                                )
                            })}
                        </div >
                    ) : (
                        <>
                            <AddOptions />
                        </>
                    )}
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentChecklistStarter ? "update" : "submit"}</button>
        </form >
    )
}