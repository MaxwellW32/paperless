"use client"
import { useSession } from "next-auth/react"
import styles from "./page.module.css"
import { useState } from "react"
import { checkIfUserEmailInUse } from "@/serverFunctions/handleUser"
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"

//roles
//admin - admin - maxwellwedderburn@outlook.com
//christopher Masters - client - regular - uncommonfavour32@gmail.com
//maxwell wedderburn - datacenter department - maxwellwedderburn32@gmail.com
//Adrian Dixon - security department - squaremaxtech@gmail.com
//Danielle is department manager - head - need other email

//to do
//leave only client forms on older saved client requests
//delete button
//cancellation button for requests - cancellation reasons, notes

//plan for today
//
//
//

export default function Home() {
  const { data: session } = useSession()

  const [email, emailSet] = useState("")

  async function handleSubmit() {
    try {
      //ensure user is expected
      const canLogin = await checkIfUserEmailInUse(email)

      if (!canLogin) {
        throw new Error("not seeing email - contact us to setup an account")
      }

      toast.success("sending login email")

      await signIn("nodemailer", {
        email: email,
        callbackUrl: `${window.location.origin}/dashboard`,
        redirect: false,
      })

      toast.success("sent")

    } catch (error) {
      consoleAndToastError(error)
    }
  }

  return (
    <main className={styles.main}>
      <h1>Paperless</h1>

      {session === null && (
        <div style={{ display: "grid", alignContent: "flex-start", gap: ".5rem", justifyItems: "center" }}>
          <h3>Email sign in</h3>

          <input type="text" value={email} placeholder="Please enter your email"
            onChange={(e) => {
              emailSet(e.target.value)
            }}

            onKeyDown={e => {
              const seenKey = e.key.toLowerCase()

              if (seenKey === "enter") {
                handleSubmit()
              }
            }}
          />

          <button className="button1" style={{ justifySelf: "center" }}
            onClick={handleSubmit}
          >Submit</button>
        </div>
      )}
    </main>
  )
}
