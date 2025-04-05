"use client"
import { consoleAndToastError } from "@/usefulFunctions/consoleErrorWithToast"
import { signIn } from "next-auth/react"
import { useState } from "react"
import toast from "react-hot-toast"

export default function Page() {
    const [email, emailSet] = useState("")

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: ".5rem", justifyItems: "center" }}>
            <h3>Sign in with Email</h3>

            <input type="text" value={email} placeholder="enter your email"
                onChange={(e) => {
                    emailSet(e.target.value)
                }}
            />

            <button className="button1" style={{ justifySelf: "center" }}
                onClick={async () => {
                    try {
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
                }}
            >Submit</button>
        </div>
    )
}
