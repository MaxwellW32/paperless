"use client"
import { newClientRequest, tapeDepositRequestType, userToCompany } from "@/types";
import { deepClone } from "@/utility/utility";
import { Session } from "next-auth"
import { useEffect, useState } from "react";

//design from client access
//then do from egov perspective

export default function DepositTape({ seenSession }: { seenSession: Session }) {
    const initialRequestObj: newClientRequest = {
        data: {
            type: "tapeDeposit"
        },
    }

    const [requestObj, requestObjSet] = useState<newClientRequest>(deepClone(initialRequestObj))
    const [usersToCompanies, usersToCompaniesSet] = useState<userToCompany[]>()

    //get usersToCompanies
    useEffect(() => {
        const search = async () => {
            const seenUsersToCompanies = 
        }
        search()
    }, [])

    return (
        <div>

        </div>
    )
}