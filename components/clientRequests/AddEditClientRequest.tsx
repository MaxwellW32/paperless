"use client"
import { addClientRequests } from "@/serverFunctions/handleClientRequests";
import { checklistItemFormType, checklistStarter, newClientRequest, newClientRequestSchema, user, userToCompany } from "@/types";
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast";
import { deepClone } from "@/utility/utility";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import RenderChecklistForm from "./RenderChecklistFormForm";

export default function AddEditClientRequest({ checklistStarter, seenUser }: { checklistStarter: checklistStarter, seenUser: user }) {
    const [chosenUser,] = useState<user | undefined>()
    const [activeUserToCompanyId, activeUserToCompanyIdSet] = useState<userToCompany["id"] | undefined>()

    const activeUserToCompany = useMemo<userToCompany | undefined>(() => {
        if (chosenUser === undefined || chosenUser.usersToCompanies === undefined || activeUserToCompanyId === undefined) return undefined

        return chosenUser.usersToCompanies.find(eachUserToCompany => eachUserToCompany.id === activeUserToCompanyId)
    }, [chosenUser?.usersToCompanies, activeUserToCompanyId])

    const initialClientRequest: newClientRequest = {
        companyId: "",
        checklist: checklistStarter.checklist,
    }

    const [newClientRequest, newClientRequestSet] = useState<newClientRequest>(deepClone(initialClientRequest))

    const [formErrors, formErrorsSet] = useState<{ [key: string]: string }>({})

    //if only one company for user set as active
    useEffect(() => {
        //only run for clients
        if (seenUser.fromDepartment) return
        if (seenUser.usersToCompanies === undefined) return

        if (seenUser.usersToCompanies.length === 1) {
            activeUserToCompanyIdSet(seenUser.usersToCompanies[0].id)
        }
    }, [])

    function checkIfValid() {
        formErrorsSet({})

        const seenSchemaResults = newClientRequestSchema.safeParse(newClientRequest)

        if (seenSchemaResults.success) {

        } else if (seenSchemaResults.error !== undefined) {
            formErrorsSet(prevFormErrors => {
                const newFormErrors = { ...prevFormErrors }

                seenSchemaResults.error.errors.forEach(eachError => {
                    const errorKey = eachError.path.join('/')
                    newFormErrors[errorKey] = eachError.message
                })

                return newFormErrors
            })
        }
    }

    async function handleSubmit() {
        try {
            //send off new client request
            if (activeUserToCompany === undefined) throw new Error("active user company undefined")

            //validation
            newClientRequestSchema.parse(newClientRequest)

            //send 
            await addClientRequests(newClientRequest, { companyIdBeingAccessed: activeUserToCompany.companyId })

            toast.success("submitted")

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    const [activeChecklistFormIndex, activeChecklistFormIndexSet] = useState<number | undefined>(() => {
        const seendIndex = newClientRequest.checklist.findIndex(eachChecklist => eachChecklist.type === "form" && !eachChecklist.completed)
        if (seendIndex < 0) return undefined

        return seendIndex
    })

    return (
        <form style={{ display: "grid", alignContent: "flex-start", gap: "1rem", overflowY: "auto" }} action={() => { }}>
            {activeChecklistFormIndex !== undefined && (
                <RenderChecklistForm seenForm={newClientRequest.checklist[activeChecklistFormIndex] as checklistItemFormType} newClientRequestSet={newClientRequestSet} activeChecklistFormIndex={activeChecklistFormIndex}
                />
            )}

            <button className="button1"
                onClick={handleSubmit}
            >submit new request</button>
        </form>
    )
}