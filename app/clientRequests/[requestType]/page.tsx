import { auth } from '@/auth/auth'
import AddEditClientRequest from '@/components/clientRequests/AddEditClientRequest'
import NotLoggedIn from '@/components/NotLoggedIn'
import { getSpecificChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import React from 'react'

export default async function Page({ params }: { params: { requestType: string } }) {
    const session = await auth()

    //ensure logged in
    if (session === null) {
        return <NotLoggedIn />
    }

    //ensure seeing client request starter
    const seenChecklistStarter = await getSpecificChecklistStarters(params.requestType)
    if (seenChecklistStarter === undefined) {
        return (
            <p>Not seeing this client request</p>
        )
    }

    return (
        <AddEditClientRequest checklistStarter={seenChecklistStarter} seenSession={session} />
    )
}
