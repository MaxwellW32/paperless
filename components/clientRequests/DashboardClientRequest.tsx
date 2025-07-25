"use client"
import { checklistItemFormType, checklistItemType, clientRequest, department, refreshObjType, refreshWSObjType, resourceAuthType, userDepartmentCompanySelection } from '@/types'
import React from 'react'
import styles from "./style.module.css"
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import { useAtom } from 'jotai'
import { refreshObjGlobal, refreshWSObjGlobal, resourceAuthGlobal, userDepartmentCompanySelectionGlobal } from '@/utility/globalState'
import { useSession } from 'next-auth/react'
import { updateClientRequests, updateClientRequestsChecklist } from '@/serverFunctions/handleClientRequests'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import { updateRefreshObj } from '@/utility/utility'
import { addTapes, updateTapes } from '@/serverFunctions/handleTapes'
import { addEquipment, updateEquipment } from '@/serverFunctions/handleEquipment'

//seen by admins
//company users
//department users

export default function DashboardClientRequest({ eachClientRequest, viewButtonFunction, editButtonFunction, seenDepartment, editButtonComp, ...elProps }: { eachClientRequest: clientRequest, viewButtonFunction?: () => void, editButtonFunction?: () => void, seenDepartment?: department, editButtonComp?: React.JSX.Element } & React.HTMLAttributes<HTMLDivElement>) {
    const { data: session } = useSession()
    const [resourceAuth,] = useAtom<resourceAuthType | undefined>(resourceAuthGlobal)

    const [userDepartmentCompanySelection,] = useAtom<userDepartmentCompanySelection | null>(userDepartmentCompanySelectionGlobal)
    const [, refreshObjSet] = useAtom<refreshObjType>(refreshObjGlobal)
    const [, refreshWSObjSet] = useAtom<refreshWSObjType>(refreshWSObjGlobal)

    const activeChecklistItemIndex = eachClientRequest.checklist.findIndex(eachChecklistItem => !eachChecklistItem.completed)
    const activeChecklistItem: checklistItemType | undefined = activeChecklistItemIndex !== -1 ? eachClientRequest.checklist[activeChecklistItemIndex] : undefined

    const progressBar: number | undefined = activeChecklistItemIndex !== -1 ? (activeChecklistItemIndex + 1) / eachClientRequest.checklist.length : undefined

    const canEditRequest = (session !== null && session.user.accessLevel === "admin") || (userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type === "userCompany" && userDepartmentCompanySelection.seenUserToCompany.companyId === eachClientRequest.companyId)
    let canAccessManualCheck = false

    //ensure can edit checklist item                            
    if (activeChecklistItem !== undefined && activeChecklistItem.type === "manual" && session !== null) {
        if (session.user.accessLevel === "admin") {
            canAccessManualCheck = true

        } else if (userDepartmentCompanySelection !== null) {
            //if user from company check if they can edit manual check
            if (activeChecklistItem.for.type === "client" && userDepartmentCompanySelection.type === "userCompany" && userDepartmentCompanySelection.seenUserToCompany.companyId === eachClientRequest.companyId) {
                canAccessManualCheck = true
            }

            //if user from department check if their department needd to sign off on manual check
            if (activeChecklistItem.for.type === "department" && userDepartmentCompanySelection.type === "userDepartment" && activeChecklistItem.for.departmenId === userDepartmentCompanySelection.seenUserToDepartment.departmentId) {
                canAccessManualCheck = true
            }
        }
    }

    const dateSubmittedTime = new Date(eachClientRequest.dateSubmitted)

    function runSameUpdate() {
        //update locally
        refreshObjSet(prevRefreshObj => {
            return updateRefreshObj(prevRefreshObj, "clientRequests")
        })

        //send off ws
        refreshWSObjSet(prevWSRefreshObj => {
            return updateRefreshObj(prevWSRefreshObj, "clientRequests")
        })
    }

    if (session === null) return null

    return (
        <div {...elProps} className={`${styles.eachClientRequest} ${elProps.className !== undefined ? elProps.className : ""}`}>
            {((session !== null && session.user.accessLevel === "admin") || (userDepartmentCompanySelection !== null && userDepartmentCompanySelection.type !== "userCompany")) && eachClientRequest.company !== undefined && (//admin or department user needs to see what company the request is from
                <>
                    <h3 className='noMargin'>{eachClientRequest.company.name}</h3>
                </>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                {eachClientRequest.checklistStarter !== undefined && (
                    <h3>{eachClientRequest.checklistStarter.type}</h3>
                )}

                <div className={styles.dateHolder}>
                    <p>{dateSubmittedTime.toLocaleDateString()}</p>

                    <p>{dateSubmittedTime.toLocaleTimeString()}</p>
                </div>
            </div>

            <label className='tag'>{eachClientRequest.status}</label>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacingS)", justifyContent: "flex-end" }}>
                {viewButtonFunction !== undefined && (
                    <button style={{ justifySelf: "flex-end" }} className='button2'
                        onClick={viewButtonFunction}
                    >view</button>
                )}

                {canEditRequest && (
                    <>
                        {editButtonFunction !== undefined && (
                            <button style={{ justifySelf: "flex-end" }} className='button2'
                                onClick={editButtonFunction}
                            >edit</button>
                        )}

                        {editButtonComp}
                    </>

                )}
            </div>

            {
                activeChecklistItem !== undefined ? (
                    <>
                        {activeChecklistItem.type === "manual" && canAccessManualCheck && (//allow sign off on prompt popups
                            <div>
                                <label>{activeChecklistItem.prompt}</label>

                                <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='confirmed!'
                                    runAction={async () => {
                                        try {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")

                                            const newCompletedManualChecklistItem = { ...activeChecklistItem }
                                            newCompletedManualChecklistItem.completed = true

                                            //update server
                                            await updateClientRequestsChecklist(eachClientRequest.id, newCompletedManualChecklistItem, activeChecklistItemIndex, resourceAuth)

                                            runSameUpdate()

                                        } catch (error) {
                                            consoleAndToastError(error)
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {((session.user.accessLevel === "admin") || (seenDepartment !== undefined && seenDepartment.canManageRequests)) && (eachClientRequest.status !== "completed") && (
                            <>
                                <h3>finish client request?</h3>

                                <ConfirmationBox text='confirm' confirmationText='are you sure you want to confirm?' successMessage='request completed!'
                                    runAction={async () => {
                                        try {
                                            if (resourceAuth === undefined) throw new Error("not seeing auth")

                                            await updateClientRequests(eachClientRequest.id, {
                                                status: "completed"
                                            }, resourceAuth, true, false)

                                            //upload tapes to db
                                            const clientForms: checklistItemFormType[] = eachClientRequest.checklist.filter(eachChecklistFilter => eachChecklistFilter.type === "form")

                                            clientForms.map(async eachClientForm => {
                                                if (eachClientForm.form.data === null) return

                                                if (eachClientForm.form.type === "tapeDeposit" || eachClientForm.form.type === "tapeWithdraw") {
                                                    eachClientForm.form.data.tapesInRequest.map(async eachTapeInRequest => {
                                                        //update tape location
                                                        eachTapeInRequest.tapeLocation = eachClientForm.form.type === "tapeDeposit" ? "in-vault" : "with-client"

                                                        if (eachTapeInRequest.id !== undefined) {
                                                            //update tape
                                                            await updateTapes(eachTapeInRequest.id, eachTapeInRequest, resourceAuth)

                                                        } else {
                                                            //new tape to db
                                                            await addTapes(eachTapeInRequest, resourceAuth)
                                                        }

                                                        runSameUpdate()
                                                    })
                                                }

                                                if (eachClientForm.form.type === "equipmentDeposit" || eachClientForm.form.type === "equipmentWithdraw") {
                                                    eachClientForm.form.data.equipmentInRequest.map(async eachEquipmentInRequest => {
                                                        //update equipment location
                                                        eachEquipmentInRequest.equipmentLocation = eachClientForm.form.type === "equipmentDeposit" ? "on-site" : "off-site"

                                                        if (eachEquipmentInRequest.id !== undefined) {
                                                            //update tape
                                                            await updateEquipment(eachEquipmentInRequest.id, eachEquipmentInRequest, resourceAuth)

                                                        } else {
                                                            //new tape to db
                                                            await addEquipment(eachEquipmentInRequest, resourceAuth)
                                                        }

                                                        runSameUpdate()
                                                    })
                                                }
                                            })

                                        } catch (error) {
                                            consoleAndToastError(error)
                                        }
                                    }}
                                />
                            </>
                        )}
                    </>
                )
            }

            {
                progressBar !== undefined && (
                    <div style={{ position: "relative", height: ".25rem" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${progressBar * 100}%`, backgroundColor: "var(--color1)" }}></div>
                    </div>
                )
            }
        </div >
    )
}
