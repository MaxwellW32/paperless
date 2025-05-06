"use client"
import { searchObj } from '@/types'
import React, { useRef, useState } from 'react'
import Search from '../search/Search'


export default function SearchWithInput<T>({ searchObj, searchObjSet, allSearchFunc, specificSearchFunc, label, placeHolder }: {
    searchObj: searchObj<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObj<T>>>, allSearchFunc: () => void, specificSearchFunc: (text: string) => void, label: React.JSX.Element, placeHolder: string
}) {
    const [search, searchSet] = useState("")
    const searchDebounce = useRef<NodeJS.Timeout | undefined>()

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
            <Search
                searchObj={searchObj}
                searchObjSet={searchObjSet}
                searchFunction={allSearchFunc}
                showPage={true}
            />

            {label}

            <input type='text' value={search} placeholder={placeHolder}
                onChange={(e) => {
                    const seenText = e.target.value

                    //set value
                    searchSet(seenText)

                    if (searchDebounce.current) clearTimeout(searchDebounce.current)

                    searchDebounce.current = setTimeout(() => {
                        if (seenText === "") return

                        specificSearchFunc(seenText)
                    }, 1000);
                }}
            />
        </div>
    )
}