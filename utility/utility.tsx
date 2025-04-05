import { refreshObjType } from "@/types"

export function deepClone<T>(object: T): T {
    return JSON.parse(JSON.stringify(object))
}


export function updateRefreshObj(prevObj: refreshObjType, key: string) {
    const newRefreshObj = { ...prevObj }

    if (newRefreshObj[key] === undefined) {
        newRefreshObj[key] = false
    }

    newRefreshObj[key] = !newRefreshObj[key]

    return newRefreshObj
}

export function formatLocalDateTime(dateInput: Date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };

    //@ts-expect-error type
    const customDateTime = dateInput.toLocaleString('en-US', options);
    return customDateTime
}