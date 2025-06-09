import { auth } from '@/auth/auth'
import Dashboard from '@/components/dashboard/dashboard'
import LoginComp from '@/components/login/login'
import React from 'react'

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
//respond to loading state of seach items

//plan for today
//
//

export default async function Home() {
  const session = await auth()

  return (
    <>
      {session === null ? (
        <LoginComp />
      ) : (
        <Dashboard />
      )}
    </>
  )
}
