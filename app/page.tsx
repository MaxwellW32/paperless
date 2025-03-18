import { auth } from "@/auth/auth"
import styles from "./page.module.css"

export default async function Home() {
  const session = await auth()
  return (
    <main className={styles.main}>
      {session !== null && (
        <>
          <p>{session.user.name}</p>
        </>
      )}
    </main>
  )
}
