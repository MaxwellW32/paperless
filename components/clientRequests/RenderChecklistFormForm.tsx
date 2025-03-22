import { checklistItemFormType, newClientRequest } from '@/types'
import { deepClone } from '@/utility/utility'
import React, { useState } from 'react'

export default function RenderChecklistForm({ seenForm, newClientRequestSet, activeChecklistFormIndex }: { seenForm: checklistItemFormType, newClientRequestSet: React.Dispatch<React.SetStateAction<newClientRequest>>, activeChecklistFormIndex: number }) {
    const [form, formSet] = useState(deepClone(seenForm.data))

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            {Object.entries(form).map(eachFormEntry => {
                const eachFormKey = eachFormEntry[0]
                const eachFormValue = eachFormEntry[1]

                return (
                    <div key={eachFormKey} style={{ display: "grid", alignContent: "flex-start" }}>
                        <input type='text' value={eachFormValue} placeholder='enter value'
                            onChange={(e) => {
                                formSet(prevForm => {
                                    const newForm = { ...prevForm }

                                    newForm[eachFormKey] = e.target.value

                                    return newForm
                                })
                            }}
                        />
                    </div>
                )
            })}

            <button
                onClick={() => {
                    newClientRequestSet(prevNewClientRequest => {
                        const newNewClientRequest = { ...prevNewClientRequest }

                        //find and update the latest checklist item form
                        newNewClientRequest.checklist = newNewClientRequest.checklist.map((eachChecklistItem, eachChecklistItemIndex) => {
                            if (eachChecklistItem.type === seenForm.type && eachChecklistItemIndex === activeChecklistFormIndex) {
                                eachChecklistItem.data = form
                            }

                            return eachChecklistItem
                        })

                        return newNewClientRequest
                    })
                }}
            >send up</button>
        </div>
    )
}
