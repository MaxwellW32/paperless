import AddEditDepartment from '@/components/departments/AddEditDepartment'
import { ensureCanAccessDepartment } from '@/serverFunctions/handleAuth'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import { department } from '@/types'
import { interpretAuthResponseAndBool } from '@/utility/utility'
import React from 'react'

export default async function Page({ params }: { params: { id: string } }) {
    const authResponse = await ensureCanAccessDepartment({ departmentIdBeingAccessed: params.id }, "u")
    const canEditDepartment = interpretAuthResponseAndBool(authResponse)

    const seenDepartment: department | undefined = canEditDepartment ? await getSpecificDepartment(params.id) : undefined

    if (!canEditDepartment) {
        return <p>not authorised to edit department</p>
    }

    if (seenDepartment === undefined) {
        return <p>not seeing department</p>
    }

    return (
        <AddEditDepartment sentDepartment={seenDepartment} />
    )
}
