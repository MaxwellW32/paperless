"use client"
import Image from "next/image"
import { useState } from "react"
import defaultImage2 from "@/public/defaultImage2.jpg"
import styles from "./styles.module.css"
import SignOutButton from "../SignOutButton"
import { Session } from "next-auth"
import Link from "next/link"

export default function MoreNavOptions({ session }: { session: Session }) {
    const [showingNav, showingNavSet] = useState(false)

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

                    {session.user.accessLevel === "admin" && (
                        <li className={styles.moreIntemsItem}
                        >
                            <Link href={"/admins"}>admin dashboard</Link>
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