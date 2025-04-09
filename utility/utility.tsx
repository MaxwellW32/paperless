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

export function offsetToJamaicanTime(isoString: string): string {
    const date = new Date(isoString);

    // Offset by -5 hours (Jamaica is UTC-5)
    date.setHours(date.getHours() - 5);

    // Return the adjusted ISO string
    return date.toISOString()
}