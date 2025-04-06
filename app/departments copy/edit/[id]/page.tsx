import AddEditDepartment from '@/components/departments/AddEditDepartment'
import { ensureCanAccessDepartment } from '@/serverFunctions/handleAuth'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import { department } from '@/types'
import React from 'react'

export default async function Page({ params }: { params: { id: string } }) {
    const canEditDepartment = await checkanEditDepartment()

    const seenDepartment: department | undefined = canEditDepartment ? await getSpecificDepartment(params.id, { departmentIdBeingAccessed: params.id }) : undefined

    async function checkanEditDepartment() {
        let localCanEditDepartment: boolean = false

        try {
            const { accessLevel } = await ensureCanAccessDepartment({ departmentIdBeingAccessed: params.id })

            //app adming / department admin can edit
            if (accessLevel === "admin") {
                localCanEditDepartment = true
            }

        } catch (error) {
            localCanEditDepartment = false
        }

        return localCanEditDepartment
    }

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
