import { auth } from "@/auth/auth"
import styles from "./page.module.css"
import Link from "next/link"
import { getChecklistStartersTypes } from "@/serverFunctions/handleChecklistStarters"
import { checklistStarter } from "@/types"

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
          <h3>Welcome {session.user.name}</h3>

          <ul style={{ display: "flex", flexWrap: "wrap", padding: "1rem" }}>
            {checklistStarterTypes.map((eachRequestType, eachRequestTypeIndex) => {
              return (
                <Link key={eachRequestTypeIndex} href={`clientRequests/${eachRequestType}`}
                >
                  <button className="button1">{eachRequestType}</button>
                </Link>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
