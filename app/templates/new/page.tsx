import AddEditTemplate from '@/components/templates/editTemplates/AddEditTemplate'
import { sessionCheckWithError } from '@/usefulFunctions/sessionCheck'
import React from 'react'

export default async function Page() {
    const session = await sessionCheckWithError()
    if (session.user.role !== "admin") return null

    return (
        <AddEditTemplate />
    )
}
