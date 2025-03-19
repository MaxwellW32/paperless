"use client"
import { getCompaniesFromUsers, getUsersToCompanies } from "@/serverFunctions/handleUsersToCompanies";
import { newClientRequest, tapeDepositRequestType, user, userToCompany } from "@/types";
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

    const initialClientRequestObj: newClientRequest = {
        //rest of fields filled in on the server
        companyId: "",
        data: {
            type: "tapeDeposit"
        },
    }
    const [newClientRequestObj, newClientRequestObjSet] = useState<newClientRequest>(deepClone(initialClientRequestObj))

    async function handleSubmit() {
        try {
            if (activeUserToCompany === undefined) throw new Error("active user company undefined")

            const finalNewClientRequestObj = { ...newClientRequestObj }

            //add on the chosen company
            finalNewClientRequestObj.companyId = activeUserToCompany.companyId



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

            {/* handle tapes */}

            <button
                onClick={handleSubmit}
            >submit</button>
        </form>
    )
}