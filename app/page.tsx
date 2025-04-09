import styles from "./page.module.css"

//remember
//set checklist to null on complete on older records

//roles
//admin - admin - maxwellwedderburn@outlook.com
//christopher Masters - client - regular - uncommonfavour32@gmail.com
//maxwell wedderburn - datacenter department - maxwellwedderburn32@gmail.com
//Adrian Dixon - security department - squaremaxtech@gmail.com
//Danielle is department manager - head - need other email

//to do
//form validation
//one recursive form - view mode, add/edit
//on array map - add required label
//checklist form re ordering
//ws use refresh/update modes for client requests - get all, or run specific update
//way to refresh admin - search properly
//remove manual company id check - just keep it at manual check

//possible auth
//table with resources - tapes, departments, companies
//certain groups have - crud access to resources
//check if user session is in group - if so what can they do
//check the action trying to be performed
//boolean response 
//save the response in the client for permission view access

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
