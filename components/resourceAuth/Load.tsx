"use client"
import { resourceAuthType, userDepartmentCompanySelection } from '@/types'
import { resourceAuthGlobal, userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useAtom } from 'jotai'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

//respond to user company / department selections and load their auth
export default function LoadResourceAuth() {
    const [, resourceAuthSet] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)
    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const { data: session } = useSession()

    //set the resource auth - can be done globally
    useEffect(() => {
        console.log(`$use effect ran`);
        if (session === null) return

        let newResourceAuth: resourceAuthType | undefined = undefined

        if (session.user.accessLevel === "admin") {
            newResourceAuth = {}

        } else {
            if (userDepartmentCompanySelection === null) return

            if (userDepartmentCompanySelection.type === "userCompany") {
                newResourceAuth = { compantyIdForAuth: userDepartmentCompanySelection.seenUserToCompany.companyId }

            } else if (userDepartmentCompanySelection.type === "userDepartment") {
                newResourceAuth = { departmentIdForAuth: userDepartmentCompanySelection.seenUserToDepartment.departmentId }
            }
        }

        if (newResourceAuth === undefined) return

        resourceAuthSet(newResourceAuth)

    }, [session, userDepartmentCompanySelection])

    return null
}
