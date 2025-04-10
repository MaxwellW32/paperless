"use client"
import AddEditCompany from '@/components/companies/AddEditCompany'
import useResourceAuth from '@/components/resourceAuth/UseLoad'
import { getSpecificCompany } from '@/serverFunctions/handleCompanies'
import { company, expectedResourceType, resourceAuthType } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { resourceAuthGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'

export default function Page({ params }: { params: { id: string } }) {
    //check if i can create a request
    const [companyExpectedResource,] = useState<expectedResourceType>({ type: "company", companyId: params.id })
    const companiesAuthResponse = useResourceAuth(companyExpectedResource)
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const [seenCompany, seenCompanySet] = useState<company | undefined>()

    //search seenDepartment
    useEffect(() => {
        const search = async () => {
            try {
                //only run when can run
                if (resourceAuth === undefined || companiesAuthResponse["u"] !== true) return

                seenCompanySet(await getSpecificCompany(params.id, resourceAuth))

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()

    }, [companiesAuthResponse["u"]])

    if (companiesAuthResponse["u"] === undefined) return null

    if (companiesAuthResponse["u"] === false) {
        return <p>not authorised to edit department</p>
    }

    if (seenCompany === undefined) {
        return <p>not seeing company</p>
    }

    return (
        <AddEditCompany sentCompany={seenCompany} />
    )
}
