import styles from "./page.module.css"

//remember
//design from client access
//then do from egov perspective
//ensure checklist only shows the forms to the client nothing else

//roles
//admin - admin - maxwellwedderburn@outlook.com
//christopher Masters - client - elevated - uncommonfavour32@gmail.com
//maxwell wedderburn - datacenter department - maxwellwedderburn32@gmail.com
//Adrian Dixon - security department - squaremaxtech@gmail.com
//Danielle is department manager - head - need other email

//to do
//emails are sent automatically
//change client request to be manual form
//then make edit client request checklist its own form 
//then make interacting with client reuests more server based

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
