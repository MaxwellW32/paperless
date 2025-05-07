"use client"
import { allFilterType, searchObj } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type searchFiltersType<T> = {
    filters: {
        [K in keyof T]?: {
            notEditable?: true,
            value: T[K]
        }
    },
    usingFilters?: boolean
}

export default function Search2<T>({ searchObj, searchObjSet, allSearchFunc, specificSearchFunc, showPage, searchFilters }: {
    searchObj: searchObj<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, allSearchFunc: () => Promise<T[]>, specificSearchFunc: (filters: allFilterType) => Promise<T[]>, showPage?: boolean, searchFilters?: searchFiltersType<T>
}) {
    const wantsToSearchAgain = useRef(false)

    const [pageIndex, pageIndexSet] = useState<number | undefined>()
    const pageDebounce = useRef<NodeJS.Timeout>()

    const searchDebounce = useRef<NodeJS.Timeout | undefined>()

    const [activeSearchFilters, activeSearchFiltersSet] = useState<searchFiltersType<T>>(searchFilters === undefined ? { filters: {}, usingFilters: false } : { ...searchFilters })

    //respond to next/prev incrementers
    useEffect(() => {
        //only run when button clicked
        if (!wantsToSearchAgain.current) return
        wantsToSearchAgain.current = false

        handleSearch()

    }, [searchObj.offset])

    //respond to want to refresh all
    useEffect(() => {
        //run everytime it flips
        if (searchObj.refreshAll === undefined) return

        //reset refreshAll
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            newSearchObj.refreshAll = false

            return newSearchObj
        })

        handleSearch(false)

    }, [searchObj.refreshAll])

    //respond to search filter changes from user
    useEffect(() => {
        if (!activeSearchFilters.usingFilters) return

        if (searchDebounce.current) clearTimeout(searchDebounce.current)

        searchDebounce.current = setTimeout(async () => {
            handleSearch()
        }, 1000);

    }, [activeSearchFilters.filters])

    function handleOffset(option: "increment" | "decrement") {
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            //set default values
            if (newSearchObj.offset === undefined) newSearchObj.offset = 0
            if (newSearchObj.incrementOffsetBy === undefined) newSearchObj.incrementOffsetBy = 50

            //dynamic change value for option
            const multiplier = option === "increment" ? 1 : -1

            //increase the offset
            newSearchObj.offset = newSearchObj.offset += (newSearchObj.incrementOffsetBy * multiplier)

            //ensure range limit
            if (newSearchObj.offset < 0) {
                newSearchObj.offset = 0
            }

            //update the page count
            pageIndexSet(newSearchObj.offset / newSearchObj.incrementOffsetBy)

            return newSearchObj
        })
    }

    function changePage(newPageIndex: number) {
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            //set default values
            if (newSearchObj.offset === undefined) return prevSearchObj
            if (newSearchObj.incrementOffsetBy === undefined) return prevSearchObj

            //current offset value / incrementOffsetby = page index - e.g 100 / 50 = 2

            //increase the offset
            newSearchObj.offset = newPageIndex * newSearchObj.incrementOffsetBy

            return newSearchObj
        })

        //allow new search
        wantsToSearchAgain.current = true
    }

    async function handleSearch(showExtra = true) {
        try {
            //notify user search is happening
            if (showExtra) {
                toast.success("searching")
            }

            //get bulk results
            if (!activeSearchFilters.usingFilters) {
                const results = await allSearchFunc()
                respondToResults(results)

                //get results with filter applied
            } else {
                const filtersOnlyPre = Object.entries(activeSearchFilters.filters).map(eachEntry => {
                    const seenKey = eachEntry[0] as keyof searchFiltersType<T>["filters"]
                    const seenValue = eachEntry[1] as searchFiltersType<T>["filters"][keyof T]

                    if (seenValue === undefined) return null

                    return [seenKey, seenValue.value]
                })

                const filtersOnly = Object.fromEntries(filtersOnlyPre.filter(each => each !== null)) as allFilterType

                const results = await specificSearchFunc(filtersOnly)
                respondToResults(results)
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    //ensure seeing results - set the state
    function respondToResults(sentResults: T[]) {
        if (sentResults.length === 0) {
            toast.error("not seeing anything")

            return
        }

        //update state
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            newSearchObj.searchItems = sentResults

            return newSearchObj
        })
    }

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
                <button className='button1'
                    onClick={async () => {
                        handleSearch()
                    }}
                >search</button>

                <button className='button2'
                    onClick={() => {
                        //decrease offset
                        handleOffset("decrement")

                        //allow new search
                        wantsToSearchAgain.current = true
                    }}
                >prev</button>

                <button className='button2'
                    onClick={() => {
                        //increase offset
                        handleOffset("increment")

                        //allow new search
                        wantsToSearchAgain.current = true
                    }}
                >next</button>

                {showPage && pageIndex !== undefined && searchObj.offset !== undefined && searchObj.incrementOffsetBy !== undefined && (
                    <>
                        <p>page</p>

                        <input type='text' value={`${pageIndex + 1}`} style={{ width: "4ch", padding: "0 .5rem", textAlign: "center" }}
                            onChange={(e) => {
                                //validate entered num
                                let seenIndex = parseInt(e.target.value)
                                if (isNaN(seenIndex)) {
                                    seenIndex = 0

                                } else {
                                    //user value valid
                                    //decrement whatever the user sent in
                                    seenIndex -= 1
                                }

                                if (seenIndex < 0) seenIndex = 0

                                pageIndexSet(seenIndex)

                                //set the offset to that page
                                if (pageDebounce.current) clearTimeout(pageDebounce.current)

                                pageDebounce.current = setTimeout(() => {
                                    changePage(seenIndex)
                                }, 1000);
                            }}
                        />
                    </>
                )}
            </div>

            {searchFilters !== undefined && (//user sent search filters so display them
                <div style={{ position: "relative" }}>
                    <button className='button2'
                        onClick={() => {
                            activeSearchFiltersSet(prevSearchFilters => {
                                const newSearchFilters = { ...prevSearchFilters }
                                newSearchFilters.usingFilters = !newSearchFilters.usingFilters

                                return newSearchFilters
                            })
                        }}
                    >{activeSearchFilters.usingFilters ? "using" : "no"} filters</button>

                    <div style={{ display: activeSearchFilters.usingFilters ? "grid" : "none", alignContent: "flex-start", gap: "1rem", padding: "1rem" }}>
                        {Object.entries(activeSearchFilters.filters).map((eachEntry) => {
                            const eachFilterKey = eachEntry[0] as keyof searchFiltersType<T>["filters"]
                            const eachFilterValue = eachEntry[1] as searchFiltersType<T>["filters"][keyof T]

                            if (eachFilterValue === undefined) return null
                            if (eachFilterValue.notEditable) return null

                            const eachFilterKeyAsString = eachFilterKey as string

                            const label = eachFilterKeyAsString.charAt(0).toUpperCase() + eachFilterKeyAsString.slice(1);

                            return (
                                <div key={eachFilterKeyAsString} style={{ display: "grid", alignContent: "flex-start", gap: ".5rem" }}>
                                    <label>{label}</label>

                                    {typeof eachFilterValue.value === "boolean" && (
                                        <button className='button1' style={{ backgroundColor: activeSearchFilters.filters[eachFilterKey] ? "" : "rgb(var(--color2))" }}
                                            onClick={() => {
                                                activeSearchFiltersSet(prevSearchFilters => {
                                                    const newSearchFilters = { ...prevSearchFilters }
                                                    newSearchFilters.filters = { ...newSearchFilters.filters }
                                                    if (newSearchFilters.filters[eachFilterKey] === undefined) return prevSearchFilters

                                                    newSearchFilters.filters[eachFilterKey] = { ...newSearchFilters.filters[eachFilterKey] }

                                                    //@ts-expect-error type
                                                    newSearchFilters.filters[eachFilterKey].value = !newSearchFilters.filters[eachFilterKey].value

                                                    return newSearchFilters
                                                })
                                            }}
                                        >{label}</button>
                                    )}

                                    {(typeof eachFilterValue.value === "string" || typeof eachFilterValue.value === "number") && (
                                        <input type={typeof eachFilterValue.value === "number" ? "number" : "text"} value={eachFilterValue.value} placeholder={`enter ${label}`}
                                            onChange={(e) => {
                                                let seenText: string | number = e.target.value

                                                if (typeof eachFilterValue.value === "number") {
                                                    seenText = parseInt(seenText)

                                                    if (isNaN(seenText)) {
                                                        seenText = 0
                                                    }
                                                }

                                                activeSearchFiltersSet(prevSearchFilters => {
                                                    const newSearchFilters = { ...prevSearchFilters }
                                                    newSearchFilters.filters = { ...newSearchFilters.filters }
                                                    if (newSearchFilters.filters[eachFilterKey] === undefined) return prevSearchFilters

                                                    newSearchFilters.filters[eachFilterKey] = { ...newSearchFilters.filters[eachFilterKey] }

                                                    //@ts-expect-error type
                                                    newSearchFilters.filters[eachFilterKey].value = seenText

                                                    return newSearchFilters
                                                })
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
