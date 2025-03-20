"use client"
import { signOut } from 'next-auth/react'
import React from 'react'

export default function SignOutButton() {
    return (
        <button className='button1'
            onClick={() => {
                signOut({
                    redirectTo: "/"
                })
            }}
        >Logout
        </button>
    )
}
