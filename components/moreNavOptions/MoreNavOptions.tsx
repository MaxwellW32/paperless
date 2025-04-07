"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import noImage from "@/public/noImage.jpg"
import styles from "./styles.module.css"
import SignOutButton from "../SignOutButton"
import { Session } from "next-auth"
import Link from "next/link"
import { useAtom } from "jotai"
import { userDepartmentCompanySelection } from "@/types"
import { userDepartmentCompanySelectionGlobal } from "@/utility/globalState"
import { ensureCanAccessCompany, ensureCanAccessDepartment } from "@/serverFunctions/handleAuth"
import { resolveFuncToBool } from "@/utility/utility"

export default function MoreNavOptions({ session }: { session: Session }) {
    const [showingNav, showingNavSet] = useState(false)
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [canViewEditDepartment, canViewEditDepartmentSet] = useState(false)
    const [canViewEditCompany, canViewEditCompanySet] = useState(false)

    //get canViewEditDepartment on load
    useEffect(() => {
        const search = async () => {
            if (userDepartmentCompanySelection === null) return

            //check if non admin user can edit company/department 
            if (userDepartmentCompanySelection.type === "userDepartment") {
                canViewEditDepartmentSet(await resolveFuncToBool(async () => {
                    await ensureCanAccessDepartment({ departmentIdBeingAccessed: userDepartmentCompanySelection.seenUserToDepartment.departmentId }, "u")
                }));

            } else if (userDepartmentCompanySelection.type === "userCompany") {
                canViewEditCompanySet(await resolveFuncToBool(async () => {
                    await ensureCanAccessCompany({ companyIdBeingAccessed: userDepartmentCompanySelection.seenUserToCompany.companyId }, "u")
                }));
            }
        }
        search()

    }, [userDepartmentCompanySelection])

    return (
        <div className={styles.contDiv}>
            <Image alt="logo" src={session.user.image !== null ? session.user.image : noImage} width={30} height={30} style={{ objectFit: "cover" }}
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