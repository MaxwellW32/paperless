import AddEditCompany from '@/components/companies/AddEditCompany'
import { ensureCanAccessCompany } from '@/serverFunctions/handleAuth'
import { getSpecificCompany } from '@/serverFunctions/handleCompanies'
import { company } from '@/types'
import { interpretAuthResponseAndBool } from '@/utility/utility'
import React from 'react'

export default async function Page({ params }: { params: { id: string } }) {
    const authResponse = await ensureCanAccessCompany({ companyIdBeingAccessed: params.id }, "u")
    const canEditCompany = interpretAuthResponseAndBool(authResponse)

    const seenCompany: company | undefined = canEditCompany ? await getSpecificCompany(params.id, { companyIdBeingAccessed: params.id }) : undefined

    if (!canEditCompany) {
        return <p>not authorised to edit company</p>
    }

    if (seenCompany === undefined) {
        return <p>not seeing company</p>
    }

    return (
        <AddEditCompany sentCompany={seenCompany} />
    )
}
