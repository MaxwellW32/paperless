"use client"
import { searchObj } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import React, { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export default function Search<T>({ searchObj, searchObjSet, searchFunction, searchLabel = "search" }: {
    searchObj: searchObj<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, searchFunction: () => void, searchLabel?: string,
}) {
    const wantsToSearchAgain = useRef(false)

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

            return newSearchObj
        })
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
            </div>
        </div>
    )
}
