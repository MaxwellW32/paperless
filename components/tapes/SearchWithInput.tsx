"use client"
import { searchObj } from '@/types'
import React, { useRef, useState } from 'react'
import Search from '../search/Search'
import toast from 'react-hot-toast'


export default function SearchWithInput<T>({ searchObj, searchObjSet, allSearchFunc, specificSearchFunc, label, placeHolder }: {
    searchObj: searchObj<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, allSearchFunc: () => Promise<T[]>, specificSearchFunc: (text: string) => Promise<T[]>, label: React.JSX.Element, placeHolder: string
}) {
    const [search, searchSet] = useState("")
    const searchDebounce = useRef<NodeJS.Timeout | undefined>()

    function respondToResults(sentResults: T[]) {
        //tell of results
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
            <Search
                searchObj={searchObj}
                searchObjSet={searchObjSet}
                searchFunction={async () => {
                    const seenResults = await allSearchFunc()
                    respondToResults(seenResults)
                }}
                showPage={true}
            />

            {label}

            <input type='text' value={search} placeholder={placeHolder}
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
    )
}