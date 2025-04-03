import styles from "./page.module.css"

//design from client access
//then do from egov perspective

//roles
//maxwell is admin of app - maxwellwedderburn32
//christopher Masters is making this request as the client - elevated - uncommonfavour32@gmail.com
//Adrian Dixon is in the security department - squaremaxtech@gmail.com
//Danielle is department manager - head - need other email
//Donovan is making this request from egov - elevated - need other email

//ensure checklist only shows the forms to the client nothing else

//client request is sent to the server
//from there the checklist of it gets updated
//departments interact with manual switches
//emails are sent automatically
//
//change up manual checks to be assigned by department
//same with email - choose department/company screens - hod filter
//need department has manage abilities check
//

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
