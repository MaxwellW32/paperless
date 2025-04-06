import AddEditCompany from '@/components/companies/AddEditCompany'
import { ensureUserIsAdmin } from '@/serverFunctions/handleAuth'
import React from 'react'

export default async function Page() {
    await ensureUserIsAdmin()

    return (
        <AddEditCompany />
    )
}
