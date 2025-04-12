import { authAccessLevelResponseType, refreshObjType } from "@/types"

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

export function formatLocalDateTime(seenDate: Date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };

    //@ts-expect-error type
    const customDateTime = seenDate.toLocaleString('en-US', options);
    return customDateTime
}

export function cleanHourTimeRound(seenDate: Date, timeChange: number) {
    seenDate.setHours(seenDate.getHours() + timeChange);
    seenDate.setMinutes(0, 0, 0);

    return seenDate
}

export async function resolveFuncToBool(seenFunc: () => Promise<void>): Promise<boolean> {
    try {
        await seenFunc()

        return true

    } catch (error) {
        let seenError = error
        seenError = null
        return false
    }
}

export function interpretAuthResponseAndError(authResponse: string | authAccessLevelResponseType) {
    if (typeof authResponse === "string") throw new Error(authResponse)

    return authResponse
}
export function interpretAuthResponseAndBool(authResponse: string | authAccessLevelResponseType) {
    if (typeof authResponse === "string") return false

    return true
}

export function offsetTime(seenDate: Date, timeInteger: number) {
    // Offset
    seenDate.setHours(seenDate.getHours() + timeInteger);

    // Return the adjusted ISO string
    return seenDate
}