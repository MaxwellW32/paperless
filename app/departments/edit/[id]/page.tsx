"use client"
import AddEditDepartment from '@/components/departments/AddEditDepartment'
import useResourceAuth from '@/components/resourceAuth/UseLoad'
import { getSpecificDepartment } from '@/serverFunctions/handleDepartments'
import { department, expectedResourceType, resourceAuthType } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { resourceAuthGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

export default function Page({ params }: { params: { id: string } }) {
    //check if i can create a request
    const [departmentExpectedResource,] = useState<expectedResourceType>({ type: "department", departmentId: params.id })
    const departmentsAuthResponse = useResourceAuth(departmentExpectedResource)
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const [seenDepartment, seenDepartmentSet] = useState<department | undefined>()

    //search seenDepartment
    useEffect(() => {
        const search = async () => {
            try {
                //only run when can run
                if (resourceAuth === undefined || departmentsAuthResponse["u"] !== true) return

                const seenDepartment = await getSpecificDepartment(params.id, resourceAuth)
                if (seenDepartment === undefined) throw new Error("not seeing department")

                seenDepartmentSet(seenDepartment)

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [departmentsAuthResponse["u"]])

    if (departmentsAuthResponse["u"] === undefined) return null

    if (departmentsAuthResponse["u"] === false) {
        return <p>not authorised to edit department</p>
    }

    if (seenDepartment === undefined) return null

    return (
        <AddEditDepartment sentDepartment={seenDepartment} />
    )
}
