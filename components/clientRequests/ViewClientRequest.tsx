"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { clientRequest, company, department, user, userDepartmentCompanySelection } from '@/types'
import { getSpecificCompany } from '@/serverFunctions/handleCompanies'
import Moment from 'react-moment';
import { getSpecificUsers } from '@/serverFunctions/handleUser'
import { ReadDynamicChecklistForm } from '../makeReadDynamicChecklistForm/DynamicChecklistForm'
import { ViewTapeDepositForm } from '../forms/tapeDeposit/ViewTapeDepositForm'
import { formatLocalDateTime } from '@/utility/utility'
import { useAtom } from 'jotai'
import { userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useSession } from 'next-auth/react'

export default function ViewClientRequest({ sentClientRequest, department }: { sentClientRequest: clientRequest, department?: department }) {
    const [seenCompany, seenCompanySet] = useState<company | undefined>()
    const [seenCompanyUsers, seenCompanyUsersSet] = useState<user[]>([])
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const { data: session } = useSession()

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
                    <h2>{seenCompany.name}</h2>
                </>
            )}

            <h3>{formatLocalDateTime(sentClientRequest.dateSubmitted)}</h3>

            <p><Moment fromNow>{sentClientRequest.dateSubmitted}</Moment></p>

            <label className='tag'>{sentClientRequest.status}</label>

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

            <h3>ETA</h3>

            <Moment utc-5="true" format="MMM D, YYYY, h:mm A">
                {sentClientRequest.eta}
            </Moment>

            <div style={{ display: "grid", alignContent: "flex-start", gap: "2rem" }}>
                {sentClientRequest.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                    if (eachChecklistItem.type !== "form" || session === null) return null

                    let canShowForm = false

                    //everyone can see dynamic form
                    if (eachChecklistItem.form.type === "dynamic") {
                        canShowForm = true

                    } else {
                        if (session.user.accessLevel === "admin") {
                            canShowForm = true
                        }

                        if (userDepartmentCompanySelection !== null) {
                            //company user can view / department user with proper access
                            if ((department !== undefined && department.canManageRequests) || (userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany")) {
                                canShowForm = true
                            }
                        }
                    }

                    if (!canShowForm) return null

                    return (
                        <div key={eachChecklistItemIndex}>
                            {eachChecklistItem.form.type === "dynamic" && (
                                <ReadDynamicChecklistForm seenForm={eachChecklistItem.form.data} />
                            )}

                            {eachChecklistItem.form.type === "tapeDeposit" && (
                                <ViewTapeDepositForm seenFormData={eachChecklistItem.form.data} />
                            )}
                        </div>
                    )
                })}
            </div>
        </main>
    )
}













































