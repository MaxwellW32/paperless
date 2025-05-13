import { authAccessLevelResponseType, baseDynamicFormType, dateSchma, refreshObjType } from "@/types"
import { z } from "zod"

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

export function moveItemInArray<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
    const newArr = [...arr]; // Clone to avoid mutation

    const [movedItem] = newArr.splice(fromIndex, 1); // Remove item

    newArr.splice(toIndex, 0, movedItem); // Insert at new position

    return newArr;
}


//get dynamic forms
export function validateDynamicForm(seenDynamicForm: baseDynamicFormType) {
    const numberSchema = z.number()
    const booleanSchema = z.boolean()

    Object.entries(seenDynamicForm).map(eachFormEntry => {
        const seenValue = eachFormEntry[1]

        const stringSchema = z.string().min(1, `please fill out ${seenValue.label}`)

        if (seenValue.type === "input") {
            //ignore if not required
            if (!seenValue.required) return

            if (seenValue.data.type === "string") {
                stringSchema.parse(seenValue.data.value)

            } else if (seenValue.data.type === "number") {
                numberSchema.parse(seenValue.data.value)

            } else if (seenValue.data.type === "boolean") {
                booleanSchema.parse(seenValue.data.value)

            } else if (seenValue.data.type === "date") {
                dateSchma.parse(seenValue.data.value)
            }

        } else if (seenValue.type === "object") {
            //recursively check inputs
            validateDynamicForm(seenValue.data)

        } else if (seenValue.type === "array") {
            //ensure length of array
            if (seenValue.required) {
                if (seenValue.data.length === 0) throw new Error(`please add to ${seenValue.label}`)
            }

            //recursively check inputs
            seenValue.data.forEach(eachArrItem => {
                validateDynamicForm(eachArrItem)
            })
        }
    })
}

export function spaceCamelCase(seenString: string) {
    return seenString.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })
}