import React from 'react'
import { getSpecificWebsite } from '@/serverFunctions/handleWebsites'
import ViewWebsite from '@/components/websites/viewWebsite'
import { ensureUserCanAccessWebsite } from '@/usefulFunctions/sessionCheck'

export default async function Page({ params }: { params: { websiteId: string } }) {
    const seenWebsite = await getSpecificWebsite({ option: "id", data: { id: params.websiteId } })
    if (seenWebsite === undefined) return <p>not seeing seenWebsite</p>

    const session = await ensureUserCanAccessWebsite(seenWebsite.userId, seenWebsite.authorisedUsers)

    return (
        <ViewWebsite websiteFromServer={seenWebsite} seenSession={session} />
    )
}


