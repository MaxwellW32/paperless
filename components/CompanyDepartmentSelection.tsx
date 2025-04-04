"use client"
import { userDepartmentCompanySelection, user, } from '@/types'
import { userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

export default function CompanyDepartmentSelection({ seenUser }: { seenUser: user }) {
    const [userDepartmentCompanySelection, userDepartmentCompanySelectionSet] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [ranCheck, ranCheckSet] = useState(false)

    //set first result as active
    useEffect(() => {
        if (seenUser.fromDepartment) {
            //empolyee
            if (seenUser.usersToDepartments !== undefined && seenUser.usersToDepartments.length > 0) {
                userDepartmentCompanySelectionSet({ type: "userDepartment", seenUserToDepartment: seenUser.usersToDepartments[0] })
            }

        } else {
            //department
            if (seenUser.usersToCompanies !== undefined && seenUser.usersToCompanies.length > 0) {
                userDepartmentCompanySelectionSet({ type: "userCompany", seenUserToCompany: seenUser.usersToCompanies[0] })
            }
        }

        //notify checked for active selection
        ranCheckSet(true)

    }, [])

    return (
        <div style={{ position: "relative", display: ranCheck ? "" : "none" }}>
            {userDepartmentCompanySelection === null ? (
                <>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", position: "absolute", backgroundColor: "rgb(var(--color2))", padding: "1rem" }}>
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
                    <button className='button1' style={{ backgroundColor: "rgb(var(--color1))" }}
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
