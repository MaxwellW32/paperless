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
//websockets
//html emails
//edit department goes by id - check if admin, or someone with admin access, same with companies
//change ensureCanAccessDepartment to include which access level someone can have - pass it the admin,elevated,refular check
//make it so company admins can change simple things, same with department admins

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
