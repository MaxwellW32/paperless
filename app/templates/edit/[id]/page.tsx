import AddEditTemplate from "@/components/templates/editTemplates/AddEditTemplate"
import { getSpecificTemplate } from "@/serverFunctions/handleTemplates"
import { sessionCheckWithError } from "@/usefulFunctions/sessionCheck"

export default async function Page({ params }: { params: { id: string } }) {
    const session = await sessionCheckWithError()
    if (session.user.role !== "admin") return null

    //get website template
    const seenTemplate = await getSpecificTemplate({ id: params.id })
    if (seenTemplate === undefined) return <p>not seeing template</p>

    return (
        <AddEditTemplate oldTemplate={seenTemplate} />
    )
}
