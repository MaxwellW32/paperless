import AddEditDepartment from '@/components/departments/AddEditDepartment'
import { ensureUserIsAdmin } from '@/serverFunctions/handleAuth'
import React from 'react'

export default async function Page() {
    await ensureUserIsAdmin()

    return (
        <AddEditDepartment />
    )
}
