import styles from "./page.module.css"

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
//update auth to trturn - app admin, dep admin, comp admin, ...etc - for proper updates
//set checklist to null on complete on older records
//make tape deposit forms the same


//understand
//what is resource auth response used for
//used to show/hide certain features based on the resource - e.g dashboard - who can add client request
//
//go resrouce by resource and figure out what you're trying to do
//1) client requests
//
//

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
