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
            <Link href={"/"} style={{ flex: "0 0 110px" }}>
                <Image alt="logo" src={logo} width={100} height={100} priority={true} style={{ objectFit: "contain" }} />
            </Link>

            <p style={{ fontFamily: "var(--montserrat)", flex: "1 1 auto", textAlign: "center" }}>DCO portal</p>

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
