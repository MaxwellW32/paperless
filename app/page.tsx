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
//updatr auth to trturn - app admin, dep admin, comp admin, ...etc - for proper updates
//fix tape auth - get specific tape

//department

//goal auth
//one place on server that checks auth for shared resources...

//at each component we want to clear up we use a hook to load in the auth creds - undefined or ready -  responds to the session, companyDepartmentSelection obj

//on client run all crud checks for that resource and store user access - crud - boolean on each  - one object at resource name - then can access rights - useHook

//its gonna check if department has edit access - this
//

export default async function Home() {

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>
    </main>
  )
}
