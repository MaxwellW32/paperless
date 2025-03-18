"use client"
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function Page() {
    const [email, emailSet] = useState("")

    return (
        <div style={{ display: "grid", alignItems: "center", justifyItems: "center", alignContent: "flex-start", gap: ".5rem" }}>
            <h3>Sign in with Email</h3>

            <input type="text" value={email} placeholder="enter your email"
                onChange={(e) => {
                    emailSet(e.target.value)
                }}
            />

            <button className="mainButton"
                onClick={async () => {
                    try {
                        const signInResult = await signIn("nodemailer", {
                            email: email,
                            callbackUrl: `${window.location.origin}`,
                            redirect: false,
                            // redirectTo: "/"
                        })

                    } catch (error) {
                        consoleAndToastError(error)
                    }
                }}
            >Submit</button>
        </div>
    )
}
