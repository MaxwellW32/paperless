"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import noImage from "@/public/noImage.jpg"
import styles from "./styles.module.css"
import SignOutButton from "../SignOutButton"
import { Session } from "next-auth"
import Link from "next/link"
import { useAtom } from "jotai"
import { expectedResourceType, userDepartmentCompanySelection } from "@/types"
import { userDepartmentCompanySelectionGlobal } from "@/utility/globalState"
import useResourceAuth from "../resourceAuth/UseLoad"

export default function MoreNavOptions({ session }: { session: Session }) {
    const [departmentExpectedResource, departmentExpectedResourceSet] = useState<expectedResourceType | undefined>(undefined)
    const departmentsAuthResponse = useResourceAuth(departmentExpectedResource)

    const [companyExpectedResource, companyExpectedResourceSet] = useState<expectedResourceType | undefined>(undefined)
    const companiesAuthResponse = useResourceAuth(companyExpectedResource)

    const [showingNav, showingNavSet] = useState(false)
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    //set starter for auth response
    useEffect(() => {
        const search = async () => {
            if (userDepartmentCompanySelection === null) return

            //check if non admin user can edit company/department 
            if (userDepartmentCompanySelection.type === "userDepartment") {
                departmentExpectedResourceSet({
                    type: "department",
                    departmentId: userDepartmentCompanySelection.seenUserToDepartment.departmentId
                })

            } else if (userDepartmentCompanySelection.type === "userCompany") {
                companyExpectedResourceSet({
                    type: "company",
                    companyId: userDepartmentCompanySelection.seenUserToCompany.companyId
                })
            }
        }
        search()

    }, [userDepartmentCompanySelection])

    return (
        <div className={styles.contDiv}>
            <Image alt="userImage" src={session.user.image !== null ? session.user.image : noImage} width={30} height={30} style={{ objectFit: "cover" }}
                onClick={() => { showingNavSet(prev => !prev) }}
            />

            {showingNav && (
                <ul className={styles.moreItemsMenu}
                    onClick={() => { showingNavSet(false) }}
                >
                    <li style={{ padding: ".5rem" }}>{session.user.name}</li>

                    <li className={styles.moreIntemsItem}
                    >
                        <Link href={"/dashboard"}>dashboard</Link>
                    </li>

                    {userDepartmentCompanySelection !== null && (
                        <>
                            {departmentsAuthResponse["u"] && userDepartmentCompanySelection.type === "userDepartment" && (
                                <li className={styles.moreIntemsItem}
                                >
                                    <Link href={`/departments/edit/${userDepartmentCompanySelection.seenUserToDepartment.departmentId}`}>edit department</Link>
                                </li>
                            )}

                            {companiesAuthResponse["u"] && userDepartmentCompanySelection.type === "userCompany" && (
                                <li className={styles.moreIntemsItem}
                                >
                                    <Link href={`/companies/edit/${userDepartmentCompanySelection.seenUserToCompany.companyId}`}>edit company</Link>
                                </li>
                            )}
                        </>
                    )}

                    {session.user.accessLevel === "admin" && (
                        <li className={styles.moreIntemsItem}
                        >
                            <Link href={"/admin"}>admin dashboard</Link>
                        </li>
                    )}

                    <li className={styles.moreIntemsItem}>account</li>

                    <li className={styles.moreIntemsItem}>settings</li>

                    <li className={styles.moreIntemsItem}>
                        <SignOutButton />
                    </li>
                </ul>
            )}
        </div>
    )
}