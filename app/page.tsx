import styles from "./page.module.css"

//remember
//set checklist to null on complete on older records

//roles
//admin - admin - maxwellwedderburn@outlook.com
//christopher Masters - client - elevated - uncommonfavour32@gmail.com
//maxwell wedderburn - datacenter department - maxwellwedderburn32@gmail.com
//Adrian Dixon - security department - squaremaxtech@gmail.com
//Danielle is department manager - head - need other email

//to do
//websockets -- new request, update request, delete request - dashboard updates
//html emails
//edit department goes by id - check if admin, or someone with admin access, same with companies
//form validation
//one recursive form - view mode, add/edit

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
