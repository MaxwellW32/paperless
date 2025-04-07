"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { clientRequest, company, department, user } from '@/types'
import { getSpecificCompany } from '@/serverFunctions/handleCompanies'
import Moment from 'react-moment';
import { ReadRecursiveChecklistForm } from '../recursiveChecklistForm/RecursiveChecklistForm'
import { getSpecificUsers } from '@/serverFunctions/handleUser'
import { formatLocalDateTime } from '@/utility/utility'

export default function ViewClientRequest({ sentClientRequest, department }: { sentClientRequest: clientRequest, department?: department }) {
    const [seenCompany, seenCompanySet] = useState<company | undefined>()
    const [seenCompanyUsers, seenCompanyUsersSet] = useState<user[]>([])

    //search company
    useEffect(() => {
        const search = async () => {
            if (sentClientRequest === undefined) return

            seenCompanySet(await getSpecificCompany(sentClientRequest.companyId, { companyIdBeingAccessed: sentClientRequest.companyId, departmentIdForAuth: department !== undefined ? department.id : undefined }))
        }
        search()

    }, [sentClientRequest.companyId])

    //search company users
    useEffect(() => {
        const search = async () => {
            const seenUsersPre: (user | undefined)[] = await Promise.all(
                sentClientRequest.clientsAccessingSite.map(async eachUserId => {
                    return await getSpecificUsers(eachUserId)
                })
            )

            const seenUsers: user[] = seenUsersPre.filter(eachUser => eachUser !== undefined)
            seenCompanyUsersSet(seenUsers)
        }
        search()

    }, [sentClientRequest.clientsAccessingSite])




    return (
        <main className={styles.main}>
            {seenCompany !== undefined && (
                <>
                    <h3>{seenCompany.name}</h3>
                </>
            )}

            <div>
                {formatLocalDateTime(sentClientRequest.dateSubmitted)}

                <p><Moment fromNow>{sentClientRequest.dateSubmitted}</Moment></p>
            </div>

            <label className='button2' style={{ justifySelf: "flex-start" }}>{sentClientRequest.status}</label>

            {seenCompanyUsers.length > 0 && (
                <>
                    <h3>Clients visiting: </h3>

                    <div style={{ display: "grid", gap: "1rem" }}>
                        {seenCompanyUsers.map((eachUser) => {
                            return (
                                <div key={eachUser.id}>
                                    <p>{eachUser.name}</p>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            <div style={{ display: "grid", alignContent: "flex-start", gap: "2rem" }}>
                {sentClientRequest.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                    if (eachChecklistItem.type !== "form") return null

                    return (
                        <div key={eachChecklistItemIndex}>
                            <ReadRecursiveChecklistForm seenForm={eachChecklistItem.data} />
                        </div>
                    )
                })}
            </div>
        </main>
    )
}













































