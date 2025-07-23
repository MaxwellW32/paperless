"use client"
import { getSpecificUsers } from '@/serverFunctions/handleUser'
import { userDepartmentCompanySelection, user, } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'

export default function CompanyDepartmentSelection() {
    const { data: session } = useSession()
    const [userDepartmentCompanySelection, userDepartmentCompanySelectionSet] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [seenSelectionOnce, seenSelectionOnceSet] = useState(false)

    const [seenUser, seenUserSet] = useState<user | undefined>()

    //get user
    useEffect(() => {
        const search = async () => {
            try {
                if (session === null) return

                seenUserSet(await getSpecificUsers(session.user.id))

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()
    }, [session])

    //check to ensure an initial value was loaded on userDepartmentCompanySelection once
    useEffect(() => {
        if (userDepartmentCompanySelection !== null) {
            seenSelectionOnceSet(true)
        }
    }, [userDepartmentCompanySelection])

    if (seenUser === undefined || seenUser.accessLevel === "admin") return null

    return (
        <div style={{ position: "relative", display: seenSelectionOnce ? "" : "none", whiteSpace: "nowrap" }}>
            {userDepartmentCompanySelection === null ? (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", position: "absolute", backgroundColor: "var(--shade2)", padding: "var(--spacingR)" }}>
                        {seenUser.fromDepartment ? (
                            <>
                                <label>department selection</label>

                                {seenUser.usersToDepartments !== undefined && seenUser.usersToDepartments.map(eachUserDepartment => {
                                    if (eachUserDepartment.department === undefined) return null

                                    return (
                                        <button key={eachUserDepartment.id} className='button1'
                                            onClick={() => {
                                                userDepartmentCompanySelectionSet({
                                                    type: "userDepartment",
                                                    seenUserToDepartment: eachUserDepartment
                                                })
                                            }}
                                        >{eachUserDepartment.department.name}</button>
                                    )
                                })}
                            </>
                        ) : (
                            <>
                                <label>company selection</label>

                                {seenUser.usersToCompanies !== undefined && seenUser.usersToCompanies.map(eachUserCompany => {
                                    if (eachUserCompany.company === undefined) return null

                                    return (
                                        <button key={eachUserCompany.id} className='button1'
                                            onClick={() => {
                                                userDepartmentCompanySelectionSet({
                                                    type: "userCompany",
                                                    seenUserToCompany: eachUserCompany
                                                })
                                            }}
                                        >{eachUserCompany.company.name}</button>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <button className='button1'
                        onClick={() => {
                            userDepartmentCompanySelectionSet(null)
                        }}
                    >
                        {userDepartmentCompanySelection.type === "userDepartment" ? (
                            <>
                                {userDepartmentCompanySelection.seenUserToDepartment.department !== undefined && (
                                    <>{userDepartmentCompanySelection.seenUserToDepartment.department.name}</>
                                )}
                            </>
                        ) : (
                            <>
                                {userDepartmentCompanySelection.seenUserToCompany.company !== undefined && (
                                    <>{userDepartmentCompanySelection.seenUserToCompany.company.name}</>
                                )}
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    )
}
