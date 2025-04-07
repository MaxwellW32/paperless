import AddEditCompany from '@/components/companies/AddEditCompany'
import { ensureCanAccessCompany } from '@/serverFunctions/handleAuth'
import { getSpecificCompany } from '@/serverFunctions/handleCompanies'
import { company } from '@/types'
import React from 'react'

export default async function Page({ params }: { params: { id: string } }) {
    const canEditCompany = await checkanEditCompany()

    const seenCompany: company | undefined = canEditCompany ? await getSpecificCompany(params.id, { companyIdBeingAccessed: params.id }) : undefined

    async function checkanEditCompany() {
        let localCanEditCompany: boolean = false

        try {
            const { accessLevel } = await ensureCanAccessCompany({ companyIdBeingAccessed: params.id })

            //app admin / company admin can edit
            if (accessLevel === "admin") {
                localCanEditCompany = true
            }

        } catch (error) {
            localCanEditCompany = false
            console.log(`$error in checkanEditCompany`, error);
        }

        return localCanEditCompany
    }

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
