import Link from "next/link"
import { auth } from "@/auth/auth"
import styles from "./styles.module.css"
import Image from "next/image"
import logo from "@/public/logo.png"
import MoreNavOptions from "../moreNavOptions/MoreNavOptions"
import CompanyDepartmentSelection from "../CompanyDepartmentSelection"
import { getSpecificUsers } from "@/serverFunctions/handleUser"

export default async function Nav() {
    const session = await auth()
    const seenUser = session !== null ? await getSpecificUsers(session.user.id) : undefined

    return (
        <nav className={styles.nav}>
            <Link href={"/"}>
                <Image alt="logo" src={logo} width={30} height={30} priority={true} style={{ objectFit: "contain" }} />
            </Link>

            {seenUser !== undefined && (
                <CompanyDepartmentSelection seenUser={seenUser} />
            )}

            <ul className={styles.menu}>
                {session === null ? (
                    <li className={styles.menuItem}><Link href={"/login"}><button className="button1">Login</button></Link></li>
                ) : (
                    <>
                        <MoreNavOptions session={session} />
                    </>
                )}
            </ul>
        </nav>
    )
}
