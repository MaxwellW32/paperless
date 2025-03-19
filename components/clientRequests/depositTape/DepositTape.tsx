"use client"
import { getUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies";
import { newClientRequest, newTape, tapeDepositRequestType, user, userToCompany } from "@/types";
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast";
import { deepClone } from "@/utility/utility";
import { Session } from "next-auth"
import { useEffect, useMemo, useState } from "react";

//design from client access
//then do from egov perspective
//resuable way to view and edit different inputs - manually
//validate them

//roleplay
//maxwell is admin of app
//Adrian Dixon is company manager - head
//christopher is making this request as the client - elevated
//Danielle is department manager - head
//Donovan is making this request from egov - elevated

export default function AddEditDepositTape({ seenUser }: { seenUser: user }) {
    const [chosenUser, chosenUserSet] = useState<user>(seenUser)
    const [activeUserToCompanyId, activeUserToCompanyIdSet] = useState<userToCompany["id"] | undefined>()

    const activeUserToCompany = useMemo<userToCompany | undefined>(() => {
        if (chosenUser.usersToCompanies === undefined || activeUserToCompanyId === undefined) return undefined

        return chosenUser.usersToCompanies.find(eachUserToCompany => eachUserToCompany.id === activeUserToCompanyId)
    }, [chosenUser.usersToCompanies, activeUserToCompanyId])

    const initialTapeDepositRequest: tapeDepositRequestType = {
        type: "tapeDeposit",
        newTapes: []
    }
    const [newTapeDepositRequest, newTapeDepositRequestSet] = useState<tapeDepositRequestType>(deepClone(initialTapeDepositRequest))

    async function handleSubmit() {
        try {
            if (activeUserToCompany === undefined) throw new Error("active user company undefined")

            const newClientRequestObj: newClientRequest = {
                companyId: activeUserToCompany.companyId,
                data: {
                    type: "tapeDeposit",
                    newTapes: newTapeDepositRequest.newTapes
                }
            }

            //send off request

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }} action={() => { }}>
            {seenUser.usersToCompanies !== undefined && (
                <>
                    <label>Company Selection</label>

                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {seenUser.usersToCompanies.map(eachUserToCompany => {
                            if (eachUserToCompany.company === undefined) return null

                            return (
                                <button key={eachUserToCompany.id} className="button1" style={{ backgroundColor: activeUserToCompany !== undefined && eachUserToCompany.id === activeUserToCompany.id ? "rgb(var(--color1))" : "" }}>
                                    {eachUserToCompany.company.name}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            <div className="snap" style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "200px" }}>
                {/* handle tapes */}
                {newTapeDepositRequest.newTapes.map((eachNewTape, eachNewTapeIndex) => {
                    return (
                        <div key={eachNewTapeIndex} style={{ display: "grid", alignContent: "flex-start", gap: ".5rem" }}>
                            <button
                                onClick={() => {
                                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                                        const newNewTapeDepositRequest = { ...prevNewTapeDepositRequest }

                                        newNewTapeDepositRequest.newTapes = newNewTapeDepositRequest.newTapes.filter((eachNewTapeFilter, eachNewTapeFilterIndex) => { eachNewTapeFilterIndex !== eachNewTapeIndex })
                                        return newNewTapeDepositRequest
                                    })
                                }}
                            >remove</button>

                            <label>media label</label>
                            <input type="text" value={eachNewTape.mediaLabel} placeholder="enter the tape media label"
                                onChange={(e) => {
                                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                                        const newNewTapeDepositRequest = { ...prevNewTapeDepositRequest }

                                        newNewTapeDepositRequest.newTapes[eachNewTapeIndex].mediaLabel = e.target.value
                                        return newNewTapeDepositRequest
                                    })
                                }}
                            />

                            <label>initial</label>
                            <input type="text" value={eachNewTape.initial} placeholder="enter the tape initial"
                                onChange={(e) => {
                                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                                        const newNewTapeDepositRequest = { ...prevNewTapeDepositRequest }

                                        newNewTapeDepositRequest.newTapes[eachNewTapeIndex].initial = e.target.value
                                        return newNewTapeDepositRequest
                                    })
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            <button
                onClick={() => {
                    newTapeDepositRequestSet(prevNewTapeDepositRequest => {
                        const newNewTapeDepositRequest = { ...prevNewTapeDepositRequest }

                        const newTape: newTape = {
                            initial: "",
                            mediaLabel: ""
                        }

                        newNewTapeDepositRequest.newTapes = [...newNewTapeDepositRequest.newTapes, newTape]

                        return newNewTapeDepositRequest
                    })
                }}
            >add tape</button>

            <button
                onClick={handleSubmit}
            >submit</button>
        </form>
    )
}