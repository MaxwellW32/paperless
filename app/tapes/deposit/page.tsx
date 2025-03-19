import { auth } from "@/auth/auth"
import AddEditDepositTape from "@/components/clientRequests/depositTape/DepositTape"
import { getSpecificUser } from "@/serverFunctions/handleUser"

export default async function Page() {
  const session = await auth()

  if (session === null) {
    return (<p>Please login</p>)
  }

  const seenUser = await getSpecificUser(session.user.id)
  if (seenUser === undefined) {
    return (<p>not seeing user</p>)
  }

  return (
    <AddEditDepositTape seenUser={seenUser} />
  )
}
