"use client"
import styles from "./login.module.css"
import { useState } from "react"
import { checkIfUserEmailInUse } from "@/serverFunctions/handleUser"
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"

export default function LoginComp() {
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
                callbackUrl: window.location.origin,
                redirect: false,
            })

            toast.success("sent")

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <main className={styles.main}>
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
        </main>
    )
}
