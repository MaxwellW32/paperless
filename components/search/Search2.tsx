"use client"
import { allFilterType, searchObj } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type searchFiltersType = {
    type: "tape" | "equipment"
    filters: allFilterType & { userEditable?: true }
}

export default function Search2<T>({ searchObj, searchObjSet, allSearchFunc, specificSearchFunc, searchLabel = "search", showPage, searchFilters }: {
    searchObj: searchObj<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, allSearchFunc: () => Promise<T[]>, specificSearchFunc: (filters: allFilterType) => Promise<T[]>, searchLabel?: string, showPage?: boolean, searchFilters: searchFiltersType
}) {
    const wantsToSearchAgain = useRef(false)

    const [pageIndex, pageIndexSet] = useState<number | undefined>()
    const pageDebounce = useRef<NodeJS.Timeout>()

    const [search, searchSet] = useState("")
    const searchDebounce = useRef<NodeJS.Timeout | undefined>()

    type optionType = "all" | "specific"
    const [lastFunctionTypeRan, lastFunctionTypeRanSet] = useState<optionType>("all")

    //respond to next/prev incrementers
    useEffect(() => {
        //only run when button clicked
        if (!wantsToSearchAgain.current) return
        wantsToSearchAgain.current = false

        handleSearch(lastFunctionTypeRan)

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

        handleSearch(lastFunctionTypeRan, false)

    }, [searchObj.refreshAll])

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

    //search on button click
    //search on increment / decrement
    //show notifcations
    //set the state
    //get an array of filter options
    //send the filter object to the function directly
    //more options for filter
    //this component allows editing

    async function handleSearch(option: optionType, showExtra = true) {
        try {
            //notify user search is happening
            if (showExtra) {
                toast.success("searching")
            }

            //get bulk results
            if (option === "all") {
                const results = await allSearchFunc()
                respondToResults(results)

                //get results with filter applied
            } else if (option === "specific") {
                const results = await specificSearchFunc(searchFilters.filters)

                respondToResults(results)

            } else {
                throw new Error("invalid selection")
            }

            //set last run
            lastFunctionTypeRanSet(option)

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

    //instead of search with input its search only with filters - provide a list of model table names - all receive strings - if not undefined can fill out,when empty its undefined - pass the filters directly to the database unction where i can handle it 

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
                <button className='button1'
                    onClick={async () => {//always search for all results - general
                        //check if using filters
                        //if any filters detected then run specific
                        //else run all
                        //only on if user editable filters are on

                        handleSearch("all")
                    }}
                >{searchLabel}</button>

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

                <input type='text' value={search} placeholder={"enter "}
                    onChange={(e) => {
                        const seenText = e.target.value

                        //set value
                        searchSet(seenText)

                        if (searchDebounce.current) clearTimeout(searchDebounce.current)

                        searchDebounce.current = setTimeout(async () => {
                            if (seenText === "") return

                            const seenResults = await specificSearchFunc(seenText)
                            respondToResults(seenResults)
                        }, 1000);
                    }}
                />
            </div>
        </div>
    )
}
