"use client"
import { departmentCompanySelection, user, } from '@/types'
import { departmentCompanySelectionGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import React, { useEffect, useMemo, useState } from 'react'

export default function CompanyDepartmentSelection({ seenUser }: { seenUser: user }) {
    const [departmentCompanySelection, departmentCompanySelectionSet] = useAtom<departmentCompanySelection | null>(departmentCompanySelectionGlobal)
    const [ranCheck, ranCheckSet] = useState(false)

    //tell what the useer is
    //load up their possible options
    //set departmentcompanydelection
    const foundCompanyDepartmentSelectionName = useMemo<string | undefined>(() => {
        if (departmentCompanySelection === null) return undefined

        if (seenUser.fromDepartment) {
            //employee
            if (seenUser.usersToDepartments === undefined) return undefined
            if (departmentCompanySelection.type === "company") return undefined

            const seenUserDepartment = seenUser.usersToDepartments.find(eachUserToDepartment => eachUserToDepartment.departmentId === departmentCompanySelection.departmentId)
            if (seenUserDepartment === undefined || seenUserDepartment.department === undefined) return undefined

            return seenUserDepartment.department.name

        } else {
            //company
            if (seenUser.usersToCompanies === undefined) return undefined
            if (departmentCompanySelection.type === "department") return undefined

            const seenUserCompany = seenUser.usersToCompanies.find(eachUserToCompany => eachUserToCompany.companyId === departmentCompanySelection.companyId)
            if (seenUserCompany === undefined || seenUserCompany.company === undefined) return undefined

            return seenUserCompany.company.name
        }

    }, [departmentCompanySelection, seenUser.fromDepartment, seenUser.usersToDepartments, seenUser.usersToCompanies])

    //if only one result set active
    useEffect(() => {
        if (seenUser.fromDepartment) {
            //empolyee
            if (seenUser.usersToDepartments !== undefined && seenUser.usersToDepartments.length > 0) {
                departmentCompanySelectionSet({ type: "department", departmentId: seenUser.usersToDepartments[0].departmentId })
            }

        } else {
            //department
            if (seenUser.usersToCompanies !== undefined && seenUser.usersToCompanies.length > 0) {
                departmentCompanySelectionSet({ type: "company", companyId: seenUser.usersToCompanies[0].companyId })
            }
        }

        //notify checked for active selection
        ranCheckSet(true)

    }, [])

    return (
        <div style={{ position: "relative", display: ranCheck ? "" : "none" }}>
            {departmentCompanySelection === null ? (
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
                                                departmentCompanySelectionSet({
                                                    type: "department",
                                                    departmentId: eachUserDepartment.departmentId
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
                                                departmentCompanySelectionSet({
                                                    type: "company",
                                                    companyId: eachUserCompany.companyId
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
                    {foundCompanyDepartmentSelectionName !== undefined && (
                        <button className='button1' style={{ backgroundColor: "rgb(var(--color1))" }}
                            onClick={() => {
                                departmentCompanySelectionSet(null)
                            }}
                        >{foundCompanyDepartmentSelectionName}</button>
                    )}
                </>
            )}
        </div>
    )
}
