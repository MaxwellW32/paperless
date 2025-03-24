import { auth } from "@/auth/auth"
import styles from "./page.module.css"
import { getChecklistStartersTypes } from "@/serverFunctions/handleChecklistStarters"
import { checklistStarter } from "@/types"
import HomeComp from "@/components/home/Home"

//design from client access
//then do from egov perspective

//roles
//maxwell is admin of app - maxwellwedderburn32
//Adrian Dixon is company manager - head - squaremaxtech@gmail.com
//christopher Masters is making this request as the client - elevated - uncommonfavour32@gmail.com
//Danielle is department manager - head - need other email
//Donovan is making this request from egov - elevated - need other email

export default async function Home() {
  const session = await auth()
  const checklistStarterTypes: checklistStarter["type"][] = await getChecklistStartersTypes()

  return (
    <main className={styles.main}>
      {session !== null && (
        <>
          <HomeComp session={session} checklistStarterTypes={checklistStarterTypes} />
        </>
      )}
    </main>
  )
}
