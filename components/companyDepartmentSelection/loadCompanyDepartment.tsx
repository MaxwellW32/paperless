"use client"
import { getSpecificUsers } from '@/serverFunctions/handleUser'
import { user, userDepartmentCompanySelection } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import { Session } from 'next-auth'
import { useEffect, useState } from 'react'

export default function LoadCompanyDepartment({ session }: { session: Session }) {
    const [userDepartmentCompanySelection, userDepartmentCompanySelectionSet] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)

    const [seenUser, seenUserSet] = useState<user | undefined>()

    //get user
    useEffect(() => {
        const search = async () => {
            try {
                seenUserSet(await getSpecificUsers(session.user.id))

            } catch (error) {
                consoleAndToastError(error)
            }
        }
        search()
    }, [])

    //set first result as active
    useEffect(() => {
        if (seenUser === undefined) return

        //if seeing a value already no need to re-run
        if (userDepartmentCompanySelection !== null) return

        if (seenUser.accessLevel === "admin") return

        if (seenUser.fromDepartment) {
            //empolyee
            if (seenUser.usersToDepartments !== undefined && seenUser.usersToDepartments.length > 0) {
                userDepartmentCompanySelectionSet({ type: "userDepartment", seenUserToDepartment: seenUser.usersToDepartments[0] })
            }

        } else {
            //company
            if (seenUser.usersToCompanies !== undefined && seenUser.usersToCompanies.length > 0) {
                userDepartmentCompanySelectionSet({ type: "userCompany", seenUserToCompany: seenUser.usersToCompanies[0] })
            }
        }
    }, [seenUser])

    return null
}
