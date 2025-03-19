import { auth } from "@/auth/auth"
import styles from "./page.module.css"
import { requestType } from "@/types"
import Link from "next/link"

//handle different requests
//tape deposit 
//handle tape list - partial/new/unconfirmed
//start step 1, then 2
//confirm request

export default async function Home() {
  const session = await auth()
  const requestOptions: requestType[] = ["tapeDeposit", "tapeWithdraw", "equipmentDeposit", "equipmentWithdraw", "equipmentOther"]

  return (
    <main className={styles.main}>
      {session !== null && (
        <>
          <ul style={{ display: "grid", alignContent: "flex-start" }}>
            {requestOptions.map((eachRequestOption, eachRequestOptionIndex) => {
              return (
                <Link key={eachRequestOptionIndex} href={eachRequestOption === "tapeDeposit" ? "tapes/deposit" : eachRequestOption === "tapeWithdraw" ? "tapes/withdraw" : eachRequestOption === "equipmentDeposit" ? "equipment/deposit" : eachRequestOption === "equipmentWithdraw" ? "equipment/withdraw" : eachRequestOption === "equipmentOther" ? "equipment/other" : "#"}
                >{eachRequestOption}</Link>
              )
            })}
          </ul>

          <p>{session.user.name}</p>
        </>
      )}
    </main>
  )
}
