import { auth } from '@/auth/auth'
import AddEditClientRequest from '@/components/clientRequests/AddEditClientRequest'
import NotLoggedIn from '@/components/NotLoggedIn'
import { getSpecificChecklistStarters } from '@/serverFunctions/handleChecklistStarters'
import { getSpecificUser } from '@/serverFunctions/handleUser'
import React from 'react'

export default async function Page({ params }: { params: { requestType: string } }) {
    const session = await auth()

    if (session === null) {
        return <NotLoggedIn />
    }

    const seenChecklistStarter = await getSpecificChecklistStarters(params.requestType)
    if (seenChecklistStarter === undefined) {
        return (
            <p>Not seeing this client request</p>
        )
    }

    const seenUser = await getSpecificUser(session.user.id)
    if (seenUser === undefined) {
        return (
            <p>Not seeing user</p>
        )
    }

    return (
        <AddEditClientRequest checklistStarter={seenChecklistStarter} seenUser={seenUser} />
    )
}
