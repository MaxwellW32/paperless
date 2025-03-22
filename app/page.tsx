import { auth } from "@/auth/auth"
import styles from "./page.module.css"
import Link from "next/link"
import { getChecklistStartersTypes } from "@/serverFunctions/handleChecklistStarters"

//design from client access
//then do from egov perspective

//roles
//maxwell is admin of app - maxwellwedderburn32
//Adrian Dixon is company manager - head - squaremaxtech@gmail.com
//christopher Masters is making this request as the client - elevated - uncommonfavour32@gmail.com
//Danielle is department manager - head - need other email
//Donovan is making this request from egov - elevated - need other email

//make a checklist of automated and manual events
//many kinds of checklist
//manual sign off
//email department
//add to database
//
//

//new idea
//manual client request add
//each client request has things it asks for
//checklist has forms, database operations, emails sending, manual event sign off
//each form has title, type of data it requests - recursive form reads that, can mark if item is array too
//then once you receive information thats marked as completed
//next step of operation is email sending, department sign offs, whatever the checlist entails
//when ticket is closed admin gets to add information to database - tape info, equipment info 


export default async function Home() {
  const session = await auth()
  const clientRequestTypes: string[] = await getChecklistStartersTypes()

  return (
    <main className={styles.main}>
      {session !== null && (
        <>
          <h3>Welcome {session.user.name}</h3>

          <ul style={{ display: "grid", alignContent: "flex-start" }}>
            {clientRequestTypes.map((eachRequestType, eachRequestTypeIndex) => {
              return (
                <Link key={eachRequestTypeIndex} href={`clientRequests/${eachRequestType}`}
                >{eachRequestType}</Link>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
