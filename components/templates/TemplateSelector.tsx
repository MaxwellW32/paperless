"use client"
import { getAllCategories } from '@/serverFunctions/handleCategories'
import { getTemplates } from '@/serverFunctions/handleTemplates'
import { addUsedComponent } from '@/serverFunctions/handleUsedComponents'
import { category, template, handleManageUpdateUsedComponentsOptions, newUsedComponent, newUsedComponentSchema, usedComponentLocationType, viewerTemplateType, website, usedComponent } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import globalDynamicTemplates from '@/utility/globalTemplates'
import { ensureChildCanBeAddedToParent, getUsedComponentsInSameLocation } from '@/utility/utility'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function TemplateSelector({ websiteId, location, handleManageUsedComponents, viewerTemplateSet, seenUsedComponents
}: {
    websiteId: website["id"], location: usedComponentLocationType, handleManageUsedComponents(options: handleManageUpdateUsedComponentsOptions): Promise<void>, viewerTemplateSet?: React.Dispatch<React.SetStateAction<viewerTemplateType | null>>, seenUsedComponents: usedComponent[]
}) {
    const [userInteracting, userInteractingSet] = useState(false)

    const [allCategories, allCategoriesSet] = useState<category[]>([])
    const [activeCategory, activeCategorySet] = useState<category | null>(null)

    const [seenTemplates, seenTemplatesSet] = useState<template[]>([])

    //get categories on launch
    useEffect(() => {
        const search = async () => {
            try {
                allCategoriesSet(await getAllCategories())

            } catch (error) {
                consoleAndToastError(error)
            }
        }

        search()
    }, [])

    return (
        <div style={{ display: "grid", alignContent: "flex-start", backgroundColor: "rgb(var(--shade2))" }}>
            <button className='mainButton'
                onClick={() => {
                    userInteractingSet(prev => !prev)
                }}
            >{userInteracting ? "close" : viewerTemplateSet ? "Choose a template" : "Add a template"}</button>

            <div style={{ display: userInteracting ? "grid" : "none", alignContent: "flex-start", padding: "1rem", gap: "1rem", border: "1px solid rgb(var(--shade1))" }}>
                {allCategories.length > 0 && (
                    <ul style={{ display: "flex" }}>
                        {allCategories.map(eachCategory => {
                            return (
                                <button key={eachCategory.name} className='mainButton' style={{ backgroundColor: eachCategory.name === activeCategory?.name ? "rgb(var(--color1))" : "" }}
                                    onClick={async () => {
                                        try {
                                            //update active selection
                                            activeCategorySet(eachCategory)

                                            //search for template
                                            const searchedTemplates = await getTemplates({ option: "categoryId", data: { categoryId: eachCategory.name } })
                                            seenTemplatesSet(searchedTemplates)

                                            toast.success(`searched ${eachCategory.name} templates`)

                                        } catch (error) {
                                            consoleAndToastError(error)
                                        }
                                    }}
                                >{eachCategory.name}</button>
                            )
                        })}
                    </ul>
                )}

                {seenTemplates.length > 0 && (
                    <>
                        <h3>{viewerTemplateSet === undefined ? "Select" : "Swap"} your template</h3>

                        <div style={{ backgroundColor: "white", overflow: "auto", display: "grid", gridAutoFlow: "column", gridAutoColumns: "80%" }}>
                            {seenTemplates.map(eachTemplate => {
                                return (
                                    <div key={eachTemplate.id} style={{ padding: "1rem", border: "1px solid rgb(var(--shade1))", display: "grid", justifyItems: "center", alignContent: "flex-start", gap: ".5rem" }}>
                                        <h3>{eachTemplate.name}</h3>

                                        <button className='mainButton'
                                            onClick={async () => {
                                                try {
                                                    //add template to page normally 
                                                    if (viewerTemplateSet === undefined) {
                                                        //add to server
                                                        const newUsedComponent: newUsedComponent = {
                                                            websiteId: websiteId,
                                                            templateId: eachTemplate.id,
                                                            css: eachTemplate.defaultCss,
                                                            order: 0,
                                                            location: location,
                                                            data: eachTemplate.defaultData,
                                                        }

                                                        //maintain db recursive constraint with child used component
                                                        if (newUsedComponent.location.type === "child") {
                                                            ensureChildCanBeAddedToParent(newUsedComponent.location.parentId, seenUsedComponents)
                                                        }

                                                        //match other usedComponents in same location
                                                        const usedComponentsInSameLocation = getUsedComponentsInSameLocation(newUsedComponent.location, seenUsedComponents)

                                                        //ensure the ordering always adds to the last in the array
                                                        let largestOrderNumberSeen = -1
                                                        usedComponentsInSameLocation.forEach(eachUsedComponentInSameLocation => {
                                                            if (eachUsedComponentInSameLocation.order > largestOrderNumberSeen) {
                                                                largestOrderNumberSeen = eachUsedComponentInSameLocation.order
                                                            }
                                                        })
                                                        newUsedComponent.order = largestOrderNumberSeen + 1

                                                        //validate
                                                        const validatedNewUsedComponent = newUsedComponentSchema.parse(newUsedComponent)

                                                        const newAddedUsedComponent = await addUsedComponent(validatedNewUsedComponent)

                                                        //then add to page
                                                        handleManageUsedComponents({ option: "create", seenAddedUsedComponent: newAddedUsedComponent })

                                                    } else {
                                                        //only preview the template

                                                        //build template
                                                        const seenResponse = await globalDynamicTemplates(eachTemplate.id)
                                                        if (seenResponse === undefined) return

                                                        //locally build and show new template
                                                        viewerTemplateSet(prevViewerTemplate => {
                                                            if (prevViewerTemplate === null) return prevViewerTemplate

                                                            const newViewerTemplate = { ...prevViewerTemplate }

                                                            newViewerTemplate.template = eachTemplate
                                                            newViewerTemplate.builtUsedComponent = seenResponse()

                                                            return newViewerTemplate
                                                        })
                                                    }

                                                } catch (error) {
                                                    consoleAndToastError(error)
                                                }
                                            }}
                                        >select</button>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}