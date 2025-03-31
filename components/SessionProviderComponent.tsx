"use client"
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import React from 'react'

export default function SessionProviderComponent({ seenSession, children }: { seenSession: Session | null, children: React.ReactNode }) {
    return (
        <SessionProvider session={seenSession}>
            {children}
        </SessionProvider>
    )
}
