"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import defaultImage2 from "@/public/defaultImage2.jpg"
import styles from "./styles.module.css"
import SignOutButton from "../SignOutButton"
import { Session } from "next-auth"
import Link from "next/link"
import { useAtom } from "jotai"
import { userDepartmentCompanySelection } from "@/types"
import { userDepartmentCompanySelectionGlobal } from "@/utility/globalState"
import { ensureCanAccessCompany, ensureCanAccessDepartment } from "@/serverFunctions/handleAuth"

export default function MoreNavOptions({ session }: { session: Session }) {
    const [showingNav, showingNavSet] = useState(false)
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [canViewEditDepartment, canViewEditDepartmentSet] = useState(false)
    const [canViewEditCompany, canViewEditCompanySet] = useState(false)

    //get canViewEditDepartment on load
    useEffect(() => {
        const search = async () => {
            try {
                if (userDepartmentCompanySelection === null) return

                //enusre only runs for users in department 
                if (userDepartmentCompanySelection.type !== "userDepartment") return

                const { accessLevel } = await ensureCanAccessDepartment({ departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId })

                if (accessLevel === "admin") {
                    canViewEditDepartmentSet(true)
                }

            } catch (error) {
                console.log(`$error canShowViewDepartment`, error);
            }
        }
        search()

    }, [userDepartmentCompanySelection])

    //get canShowViewCompany on load
    useEffect(() => {
        const search = async () => {
            try {
                if (userDepartmentCompanySelection === null) return

                //enusre only runs for users in department 
                if (userDepartmentCompanySelection.type !== "userCompany") return

                const { accessLevel } = await ensureCanAccessCompany({ companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId })

                if (accessLevel === "admin") {
                    canViewEditCompanySet(true)
                }

            } catch (error) {
                console.log(`$error canShowViewCompany`, error);
            }
        }
        search()

    }, [userDepartmentCompanySelection])

    return (
        <div className={styles.contDiv}>
            <Image alt="logo" src={session.user.image ?? defaultImage2} width={30} height={30} style={{ objectFit: "cover" }}
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

                    {canViewEditDepartment && userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userDepartment" && (

                        <li className={styles.moreIntemsItem}
                        >
                            <Link href={`/departments/edit/${userDepartmentCompanySelection.seenUserToDepartment.departmentId}`}>edit department</Link>
                        </li>
                    )}

                    {canViewEditCompany && userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany" && (

                        <li className={styles.moreIntemsItem}
                        >
                            <Link href={`/companies/edit/${userDepartmentCompanySelection.seenUserToCompany.companyId}`}>edit company</Link>
                        </li>
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