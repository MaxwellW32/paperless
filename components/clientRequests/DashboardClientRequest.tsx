"use client"
import { checklistItemType, clientRequest, clientRequestAuthType, refreshObjType, refreshWSObjType, userDepartmentCompanySelection } from '@/types'
import React from 'react'
import styles from "./style.module.css"
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import { useAtom } from 'jotai'
import { refreshObjGlobal, refreshWSObjGlobal, userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useSession } from 'next-auth/react'
import { updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { updateRefreshObj } from '@/utility/utility'

export default function DashboardClientRequest({ eachClientRequest, viewButtonFunction, editButtonFunction }: { eachClientRequest: clientRequest, viewButtonFunction: () => void, editButtonFunction?: () => void, }) {
    const { data: session } = useSession()

    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshWSObjType>(refreshWSObjGlobal)

    const activeChecklistItemIndex = eachClientRequest.checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
    const activeChecklistItem: checklistItemType | undefined = activeChecklistItemIndex !== -1 ? eachClientRequest.checklist[activeChecklistItemIndex] : undefined

    const progressBar: number | undefined = activeChecklistItemIndex !== -1 ? (activeChecklistItemIndex + 1) / eachClientRequest.checklist.length : undefined

    const newClientRequestAuth: clientRequestAuthType = { clientRequestIdBeingAccessed: eachClientRequest.id, departmentIdForAuth: userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userDepartment" ? userDepartmentCompanySelection.seenUserToDepartment.departmentId : undefined }

    const canEditRequest = userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany"
    let canAccessManualCheck = false

    //ensure can edit checklist item                            
    if (activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && session !== null) {
        if (session.user.accessLevel === "admin") {
            canAccessManualCheck = true

        } else if (userDepartmentCompanySelection !== null) {
            //if user from company check if they can edit manual check
            if (activeChecklistItem.for.type === "company" && userDepartmentCompanySelection.type === "userCompany" && activeChecklistItem.for.companyId === userDepartmentCompanySelection.seenUserToCompany.companyId) {
                canAccessManualCheck = true
            }

            //if user from department check if they can edit manual check
            if (activeChecklistItem.for.type === "department" && userDepartmentCompanySelection.type === "userDepartment" && activeChecklistItem.for.departmenId === userDepartmentCompanySelection.seenUserToDepartment.departmentId) {
                canAccessManualCheck = true
            }
        }
    }

    return (
        <div key={eachClientRequest.id} className={styles.eachClientRequest}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                {eachClientRequest.checklistStarter !== undefined && (
                    <h3>{eachClientRequest.checklistStarter.type}</h3>
                )}

                <div className={styles.dateHolder}>
                    <p>{eachClientRequest.dateSubmitted.toLocaleDateString()}</p>

                    <p>{eachClientRequest.dateSubmitted.toLocaleTimeString()}</p>
                </div>
            </div>

            <label>{eachClientRequest.status}</label>

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", justifyContent: "flex-end" }}>
                <button style={{ justifySelf: "flex-end" }} className='button2'
                    onClick={viewButtonFunction}
                >view</button>

                {canEditRequest && editButtonFunction !== undefined && (
                    <button style={{ justifySelf: "flex-end" }} className='button2'
                        onClick={editButtonFunction}
                    >edit</button>
                )}
            </div>

            {activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && canAccessManualCheck && (
                <div>
                    <label>{activeChecklistItem.prompt}</label>

                    <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                        runAction={async () => {
                            try {
                                const newCompletedManualChecklistItem = { ...activeChecklistItem }
                                newCompletedManualChecklistItem.completed = true

                                //update server
                                await updateClientRequestsChecklist(eachClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, newClientRequestAuth)

                                //update locally
                                refreshObjSet(prevRefreshObj => {
                                    return updateRefreshObj(prevRefreshObj, "clientRequests")
                                })

                                //send off ws
                                refreshWSObjSet(prevWSRefreshObj => {
                                    return updateRefreshObj(prevWSRefreshObj, "clientRequests")
                                })

                            } catch (error) {
                                consoleAndToastError(error)
                            }
                        }}
                    />
                </div>
            )}

            {progressBar !== undefined && (
                <div style={{ position: "relative", height: ".25rem" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${progressBar * 100}%`, backgroundColor: "rgb(var(--color1))" }}></div>
                </div>
            )}
        </div>
    )
}
