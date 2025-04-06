import AddEditUserDepartment from '@/components/usersToDepartments/AddEditUserDepartment'
import { ensureUserIsAdmin } from '@/serverFunctions/handleAuth'
import React from 'react'

export default async function Page() {
    await ensureUserIsAdmin()

    return (
        <AddEditUserDepartment />
    )
}
