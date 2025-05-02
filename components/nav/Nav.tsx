import Link from "next/link"
import { auth } from "@/auth/auth"
import styles from "./styles.module.css"
import Image from "next/image"
import logo from "@/public/logo.png"
import MoreNavOptions from "../moreNavOptions/MoreNavOptions"

export default async function Nav() {
    const session = await auth()

    return (
        <nav className={styles.nav}>
            <Link href={"/"}>
                <Image alt="logo" src={logo} width={30} height={30} priority={true} style={{ objectFit: "contain" }} />
            </Link>

            <p>client portal</p>

            <ul className={styles.menu}>
                {session === null ? (
                    <div></div>
                ) : (
                    <MoreNavOptions session={session} />
                )}
            </ul>
        </nav>
    )
}
