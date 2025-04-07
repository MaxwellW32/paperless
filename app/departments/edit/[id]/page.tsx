import AddEditDepartment from '@/components/departments/AddEditDepartment'
import { ensureCanEditDepartment } from '@/serverFunctions/handleAuth'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import { department } from '@/types'
import React from 'react'

export default async function Page({ params }: { params: { id: string } }) {
    const canEditDepartment = await checkanEditDepartment()

    const seenDepartment: department | undefined = canEditDepartment ? await getSpecificDepartment(params.id, { departmentIdBeingAccessed: params.id }) : undefined

    async function checkanEditDepartment() {
        let localCanEditDepartment: boolean = false

        try {
            const { accessLevel } = await ensureCanEditDepartment({ departmentIdBeingAccessed: params.id })

            //app admin / department admin can edit
            if (accessLevel === "admin") {
                localCanEditDepartment = true
            }

        } catch (error) {
            localCanEditDepartment = false
            console.log(`$error in checkanEditDepartment`, error);
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
