import Link from "next/link"
import { auth } from "@/auth/auth"
import styles from "./styles.module.css"
import Image from "next/image"
import logo from "@/public/logo.svg"
import MoreNavOptions from "../moreNavOptions/MoreNavOptions"

export default async function Nav() {
    const session = await auth()

    return (
        <nav className={styles.nav}>
            <Link href={"/"}>
                <Image alt="logo" src={logo} width={30} height={30} style={{ objectFit: "contain" }} />
            </Link>

            <ul className={styles.menu}>
                {session === null ? (
                    <li className={styles.menuItem}><Link href={"/login"}><button className="mainButton">Login</button></Link></li>
                ) : (
                    <>
                        <MoreNavOptions session={session} />
                    </>
                )}
            </ul>
        </nav>
    )
}
