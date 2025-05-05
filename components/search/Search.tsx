"use client"
import { searchObj } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export default function Search<T>({ searchObj, searchObjSet, searchFunction, searchLabel = "search", showPage }: {
    searchObj: searchObj<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, searchFunction: () => void, searchLabel?: string, showPage?: boolean
}) {
    const wantsToSearchAgain = useRef(false)

    const [pageNum, pageNumSet] = useState<number | undefined>()
    const pageDebounce = useRef<NodeJS.Timeout>()

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

    async function handleSearch(showExtra = true) {
        try {
            if (showExtra) {
                toast.success("searching")
            }

            await searchFunction()

        } catch (error) {
            consoleAndToastError(error)
        }
    }

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
            pageNumSet(newSearchObj.offset / newSearchObj.incrementOffsetBy)

            return newSearchObj
        })
    }

    function changePage(newPageNum: number) {
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            //set default values
            if (newSearchObj.offset === undefined) return prevSearchObj
            if (newSearchObj.incrementOffsetBy === undefined) return prevSearchObj

            //current offset value / incrementOffsetby = page num
            //e.g 100 / 50 = 2
            //e.g 50 / 50 = 1

            //increase the offset
            newSearchObj.offset = newPageNum * newSearchObj.incrementOffsetBy

            return newSearchObj
        })

        //allow new search
        wantsToSearchAgain.current = true
    }

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
                <button className='button1'
                    onClick={() => { handleSearch() }}
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

                {showPage && pageNum !== undefined && searchObj.offset !== undefined && searchObj.incrementOffsetBy !== undefined && (
                    <>
                        <p>page</p>

                        <input type='text' value={`${pageNum}`} style={{ width: "4ch", padding: "0 .5rem", textAlign: "center" }}
                            onChange={(e) => {
                                //validate entered num
                                let seenNum = parseInt(e.target.value)
                                if (isNaN(seenNum)) seenNum = 0
                                if (seenNum < 1) seenNum = 1

                                pageNumSet(seenNum)

                                //set the offset to that page
                                if (pageDebounce.current) clearTimeout(pageDebounce.current)

                                pageDebounce.current = setTimeout(() => {
                                    changePage(seenNum)
                                }, 1000);
                            }}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
