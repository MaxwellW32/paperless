import styles from "./page.module.css"

//remember
//run checklist on add/update request
//set checklist to null on complete

//roles
//admin - admin - maxwellwedderburn@outlook.com
//christopher Masters - client - elevated - uncommonfavour32@gmail.com
//maxwell wedderburn - datacenter department - maxwellwedderburn32@gmail.com
//Adrian Dixon - security department - squaremaxtech@gmail.com
//Danielle is department manager - head - need other email

//to do
//change auth model on client/server - departments/company
//emails are sent automatically
//change client request to be manual form
//then make edit client request checklist its own form 
//then make interacting with client requests more server based
//make edit client request its own admin form - specific screen form
//websockets

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
