"use client"
import { Session } from "next-auth"

export default function DepositTape({ seenSession }: { seenSession: Session }) {
    console.log(`$seenSession`, seenSession);

    return (
        <div>

        </div>
    )
}