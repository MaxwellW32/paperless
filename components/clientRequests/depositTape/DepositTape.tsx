"use client"
import TextInput from "@/components/textInput/TextInput";
import { addClientRequests } from "@/serverFunctions/handleClientRequests";
import { newClientRequest, newTape, tapeDepositRequestSchema, tapeDepositRequestType, user, userToCompany } from "@/types";
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast";
import { deepClone } from "@/utility/utility";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

//design from client access
//then do from egov perspective

//roles
//maxwell is admin of app - maxwellwedderburn32
//Adrian Dixon is company manager - head - squaremaxtech@gmail.com
//christopher Masters is making this request as the client - elevated - uncommonfavour32@gmail.com
//Danielle is department manager - head - need other email
//Donovan is making this request from egov - elevated - need other email

export default function AddEditDepositTape({ seenUser }: { seenUser: user }) {
    const [chosenUser,] = useState<user>(seenUser)
    const [activeUserToCompanyId, activeUserToCompanyIdSet] = useState<userToCompany["id"] | undefined>()

    const activeUserToCompany = useMemo<userToCompany | undefined>(() => {
        if (chosenUser.usersToCompanies === undefined || activeUserToCompanyId === undefined) return undefined

        return chosenUser.usersToCompanies.find(eachUserToCompany => eachUserToCompany.id === activeUserToCompanyId)
    }, [chosenUser.usersToCompanies, activeUserToCompanyId])

    const initialTapeDepositRequest: tapeDepositRequestType = {
        type: "tapeDeposit",
        data: {
            newTapes: []
        }
    }
    const [newTapeDepositRequest, newTapeDepositRequestSet] = useState<tapeDepositRequestType>(deepClone(initialTapeDepositRequest))

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

        const seenSchemaResults = tapeDepositRequestSchema.safeParse(newTapeDepositRequest)

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
            if (activeUserToCompany === undefined) throw new Error("active user company undefined")

            //validation
            tapeDepositRequestSchema.parse(newTapeDepositRequest)

            //make new clientRequest
            const newClientRequestObj: newClientRequest = {
                companyId: activeUserToCompany.companyId,
                requestData: newTapeDepositRequest
            }

            //send 
            await addClientRequests(newClientRequestObj, { companyIdBeingAccessed: activeUserToCompany.companyId })

            toast.success("submitted")

        } catch (error) {
            consoleAndToastError(error)
        }
    }



    return (
        <form style={{ display: "grid", alignContent: "flex-start", gap: "1rem", overflowY: "auto" }} action={() => { }}>
            {seenUser.usersToCompanies !== undefined && (
                <>
                    <label>Company Selection</label>

                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {seenUser.usersToCompanies.map(eachUserToCompany => {
                            if (eachUserToCompany.company === undefined) return null

                            return (
                                <button key={eachUserToCompany.id} className="button1" style={{ backgroundColor: activeUserToCompany !== undefined && eachUserToCompany.id === activeUserToCompany.id ? "rgb(var(--color1))" : "" }}
                                    onClick={() => {
                                        activeUserToCompanyIdSet(eachUserToCompany.id)
                                    }}
                                >
                                    {eachUserToCompany.company.name}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            <div className="snap" style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
                {/* handle tapes */}
                {newTapeDepositRequest.data.newTapes.map((eachNewTape, eachNewTapeIndex) => {
                    return (
                        <div key={eachNewTapeIndex} style={{ display: "grid", alignContent: "flex-start", gap: ".5rem", width: "min(400px, 90%)", flex: "0 0 auto" }}>
                            <button className="button2"
                                onClick={() => {
                                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                                        const newNewTapeDepositRequest = deepClone(prevNewTapeDepositRequest)

                                        newNewTapeDepositRequest.data.newTapes = newNewTapeDepositRequest.data.newTapes.filter((eachNewTapeFilter, eachNewTapeFilterIndex) => eachNewTapeFilterIndex !== eachNewTapeIndex)

                                        return newNewTapeDepositRequest
                                    })
                                }}
                            >remove</button>

                            <TextInput
                                name={`data/newTapes/${eachNewTapeIndex}/mediaLabel`}
                                value={eachNewTape.mediaLabel}
                                type={undefined}
                                label={"media label"}
                                placeHolder={"enter the tape media label"}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                                        const newNewTapeDepositRequest = { ...prevNewTapeDepositRequest }

                                        newNewTapeDepositRequest.data.newTapes[eachNewTapeIndex].mediaLabel = e.target.value

                                        return newNewTapeDepositRequest
                                    })
                                }}
                                onBlur={checkIfValid}
                                errors={formErrors[`data/newTapes/${eachNewTapeIndex}/mediaLabel`]}
                            />

                            <TextInput
                                name={`data/newTapes/${eachNewTapeIndex}/initial`}
                                value={eachNewTape.initial}
                                type={undefined}
                                label={"initial"}
                                placeHolder={"enter the tape initial"}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                                        const newNewTapeDepositRequest = { ...prevNewTapeDepositRequest }

                                        newNewTapeDepositRequest.data.newTapes[eachNewTapeIndex].initial = e.target.value
                                        return newNewTapeDepositRequest
                                    })
                                }}
                                onBlur={checkIfValid}
                                errors={formErrors[`data/newTapes/${eachNewTapeIndex}/initial`]}
                            />
                        </div>
                    )
                })}
            </div>

            <button className="button1"
                onClick={() => {
                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                        const newNewTapeDepositRequest = deepClone(prevNewTapeDepositRequest)

                        const newTape: newTape = {
                            initial: "",
                            mediaLabel: ""
                        }

                        newNewTapeDepositRequest.data.newTapes = [...newNewTapeDepositRequest.data.newTapes, newTape]

                        return newNewTapeDepositRequest
                    })
                }}
            >add tape</button>

            <button className="button1"
                onClick={handleSubmit}
            >submit</button>
        </form>
    )
}