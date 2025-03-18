import { page, usedComponent, usedComponentLocationType } from '@/types'
import React, { useEffect } from 'react'

export default function LocationSelector({ location, activeLocationSet, activePage, activeUsedComponent }: { location: usedComponentLocationType, activeLocationSet: React.Dispatch<React.SetStateAction<usedComponentLocationType>>, activePage: page | undefined, activeUsedComponent: usedComponent | undefined, }) {
    const locationSelectionOptions: usedComponentLocationType["type"][] = ["header", "page", "footer", "child"]
    const activeUsedComponentCanHaveChild = activeUsedComponent !== undefined ? Object.hasOwn(activeUsedComponent.data, "children") : false

    //keep activeLocation in line with activeUsedComponent
    useEffect(() => {
        //if can accept children update the location
        if (activeUsedComponentCanHaveChild) {
            if (activeUsedComponent !== undefined) {
                activeLocationSet({
                    type: "child",
                    parentId: activeUsedComponent.id
                })
            }

        } else {
            //if not compatible with children and location set to child then switch off
            if (location.type === "child") {
                //try to switch to page
                if (activePage !== undefined) {
                    activeLocationSet({
                        type: "page",
                        pageId: activePage.id
                    })

                } else {
                    console.log(`$ran change`);

                    activeLocationSet({
                        type: "header",
                    })
                }
            }
        }

    }, [activeUsedComponent])

    //keep active location in line with page selection 
    useEffect(() => {
        if (location.type === "page") {
            if (activePage !== undefined) {
                //if page selection is active update on page change
                activeLocationSet({ type: "page", pageId: activePage.id })

            } else {
                activeLocationSet({ type: "header" })
            }
        }

    }, [activePage])


    return (
        <select value={location.type}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const eachLocationOption = event.target.value

                if (eachLocationOption === "footer") {
                    activeLocationSet({ type: "footer" })

                } else if (eachLocationOption === "header") {
                    activeLocationSet({ type: "header" })

                } else if (eachLocationOption === "page") {
                    if (activePage === undefined) return

                    activeLocationSet({ type: "page", pageId: activePage.id })
                }
            }}
        >
            {locationSelectionOptions.map(eachLocationOption => {
                if (eachLocationOption === "page" && activePage === undefined) return null
                if (eachLocationOption === "child" && !activeUsedComponentCanHaveChild) return null

                return (
                    <option key={eachLocationOption} value={eachLocationOption}

                    >Add to {eachLocationOption}</option>
                )
            })}
        </select>
    )
}
