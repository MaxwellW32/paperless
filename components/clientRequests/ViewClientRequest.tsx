"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { clientRequest, company, department } from '@/types'
import { getSpecificCompany } from '@/serverFunctions/handleCompanies'
import dashboardStyles from "@/app/dashboard.module.css"
import Moment from 'react-moment';

export default function ViewClientRequest({ sentClientRequest, department }: { sentClientRequest: clientRequest, department?: department }) {
    const [seenCompany, seenCompanySet] = useState<company | undefined>()

    //search company
    useEffect(() => {
        const search = async () => {
            if (sentClientRequest === undefined) return

            seenCompanySet(await getSpecificCompany(sentClientRequest.companyId, department !== undefined ? { departmentIdForAuth: department.id, allowRegularAccess: true } : { companyIdBeingAccessed: sentClientRequest.companyId }))
        }
        search()

    }, [sentClientRequest.companyId])

    return (
        <main className={styles.main}>
            {seenCompany !== undefined && (
                <>
                    <h3>{seenCompany.name}</h3>
                </>
            )}

            <div className={dashboardStyles.dateHolder}>
                <p>{sentClientRequest.dateSubmitted.toLocaleDateString()}</p>

                <p>{sentClientRequest.dateSubmitted.toLocaleTimeString()}</p>
            </div>

            <p><Moment fromNow>{sentClientRequest.dateSubmitted}</Moment></p>

            <p>{sentClientRequest.status}</p>
        </main>
    )
}













































