import AddEditUserDepartment from '@/components/usersToDepartments/AddEditUserDepartment'
import { ensureUserIsAdmin } from '@/serverFunctions/handleAuth'
import { getSpecificUsersToDepartments } from '@/serverFunctions/handleUsersToDepartments'
import { userToDepartment } from '@/types'
import React from 'react'

export default async function Page({ params }: { params: { id: string } }) {
    await ensureUserIsAdmin()

    const seenUserToDepartment: userToDepartment | undefined = await getSpecificUsersToDepartments({ type: "id", userDepartmentId: params.id })

    if (seenUserToDepartment === undefined) {
        return <p>not seeing userToDepartment</p>
    }

    return (
        <AddEditUserDepartment sentUserDepartment={seenUserToDepartment} />
    )
}
