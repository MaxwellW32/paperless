import Admin from '@/components/admin/Admin'
import { ensureUserIsAdmin } from '@/utility/sessionCheck'
import React from 'react'

export default async function Page() {
    await ensureUserIsAdmin()

    return (
        <Admin />
    )
}
