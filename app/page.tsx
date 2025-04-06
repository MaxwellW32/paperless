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
//admin dashboard edit all database models - CRUD
//client request normal full form - run checklist on add/update client request - add: admin, client, dept with manage - update: admin, client from comp, dept with manage 

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
