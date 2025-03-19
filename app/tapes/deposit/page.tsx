import { auth } from "@/auth/auth"
import styles from "./page.module.css"
import DepositTape from "@/components/clientRequests/tapes/DepositTape"
import { sessionCheckJSX } from "@/utility/sessionCheck"

export default async function Page() {
  const session = await auth()

  if (session === null) {
    return (<p>Please login</p>)
  }

  return (
    <main className={styles.main}>
      <DepositTape seenSession={session} />
    </main>
  )
}
