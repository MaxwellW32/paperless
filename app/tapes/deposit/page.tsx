import { auth } from "@/auth/auth"
import styles from "./page.module.css"
import AddEditDepositTape from "@/components/clientRequests/depositTape/DepositTape"
import { getUser } from "@/serverFunctions/handleUser"

export default async function Page() {
  const session = await auth()

  if (session === null) {
    return (<p>Please login</p>)
  }

  const seenUser = await getUser(session.user.id)
  if (seenUser === undefined) {
    return (<p>not seeing user</p>)
  }

  return (
    <AddEditDepositTape seenUser={seenUser} />
  )
}
