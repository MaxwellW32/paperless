"use client"

import { ensureCanAccessResource } from '@/serverFunctions/handleAuth'
import { crudOptionType, expectedResourceType, resourceAuthResponseType, resourceAuthType } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { resourceAuthGlobal } from '@/utility/globalState'
import { interpretAuthResponseAndBool } from '@/utility/utility'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'

//tell me if i have crud auth for specific resrouces
export default function useResourceAuth(resource: expectedResourceType | undefined) {
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)
    const [resourceAuthResponse, resourceAuthResponseSet] = useState<resourceAuthResponseType>({
        c: undefined,
        r: undefined,
        ra: undefined,
        u: undefined,
        d: undefined,
    })

    //run checks on specifc resource wanted
    useEffect(() => {
        if (resourceAuth === undefined || resource === undefined) return

        const crudOptions: crudOptionType[] = ["c", "r", "ra", "u", "d"]

        crudOptions.forEach(async (eachCrudOption) => {
            try {
                const authResponse = await ensureCanAccessResource(resource, resourceAuth, eachCrudOption)
                const allowed = interpretAuthResponseAndBool(authResponse)

                resourceAuthResponseSet(prevResourceAuthResponse => {
                    const newResourceAuthResponse = { ...prevResourceAuthResponse }

                    newResourceAuthResponse[eachCrudOption] = allowed

                    return newResourceAuthResponse
                })

            } catch (error) {
                consoleAndToastError(error)
            }
        })

    }, [resourceAuth, resource])

    return resourceAuthResponse
}
