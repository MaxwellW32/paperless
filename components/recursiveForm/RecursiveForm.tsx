"use client"
import { recursiveFormArrayStarterItems, recursiveFormMoreInfo, recursiveFormMoreFormInfoElementType, nullishStarters } from '@/types'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { z } from 'zod'
import RecursiveShowMore from './RecursiveShowMore'
import RecursiveConfirmationBox from './RecursiveConfirmationBox'

export default function RecursiveForm({ seenForm, seenMoreFormInfo, seenArrayStarters, seenNullishStarters, seenSchema, updater }: { seenForm: object, seenMoreFormInfo: recursiveFormMoreInfo, seenArrayStarters: recursiveFormArrayStarterItems, seenNullishStarters: nullishStarters, seenSchema: z.Schema, updater: (newObject: unknown) => void }) {
    const [form, formSet] = useState<object>(seenForm)
    const [userInteracted, userInteractedSet] = useState(false)
    const [formErrors, formErrorsSet] = useState<{ [key: string]: string }>({})
    const changeFromAbove = useRef(false)

    //update form if parent changes
    useEffect(() => {
        changeFromAbove.current = true
        formSet(seenForm)

    }, [seenForm])

    //send changes in form upwards
    useEffect(() => {
        //dont send changes if this component changed the form
        if (changeFromAbove.current) {
            changeFromAbove.current = false
            return
        }

        if (!userInteracted) {
            return
        }

        //reset
        formErrorsSet({})

        const seenSchemaResults = seenSchema.safeParse(form)

        if (seenSchemaResults.success) {
            updater(seenSchemaResults.data)

        } else if (seenSchemaResults.error !== undefined) {
            formErrorsSet(prevFormErrors => {
                const newFormErrors = { ...prevFormErrors }

                seenSchemaResults.error.errors.forEach(eachError => {
                    const errorKey = eachError.path.join('/')
                    newFormErrors[errorKey] = eachError.message
                })

                return newFormErrors
            })
        }
    }, [form, userInteracted])

    return (
        <RenderForm seenForm={form} seenFormSet={formSet} seenMoreFormInfo={seenMoreFormInfo} seenArrayStarters={seenArrayStarters} seenNullishStarters={seenNullishStarters} userInteractedSet={userInteractedSet} sentKeys={""} seenFormErrors={formErrors} />
    )
}

function RenderForm({ seenForm, seenFormSet, userInteractedSet, seenMoreFormInfo, seenArrayStarters, seenNullishStarters, sentKeys, seenFormErrors, parentArrayName, ...elProps }: { seenForm: object, seenFormSet: React.Dispatch<React.SetStateAction<object>>, userInteractedSet: React.Dispatch<React.SetStateAction<boolean>>, seenMoreFormInfo: recursiveFormMoreInfo, seenArrayStarters: recursiveFormArrayStarterItems, seenNullishStarters: nullishStarters, sentKeys: string, seenFormErrors: { [key: string]: string }, parentArrayName?: string } & React.HTMLAttributes<HTMLDivElement>) {

    function runSameOnAll() {
        userInteractedSet(true)
    }

    return (
        <div {...elProps} style={{ display: "grid", gap: "1rem", ...(parentArrayName ? { gridAutoColumns: "90%", gridAutoFlow: "column" } : { alignContent: "flex-start" }), overflow: "auto", ...elProps?.style }} className={`${parentArrayName ? "snap" : ""} ${elProps?.className ?? ""}`}>
            {Object.entries(seenForm).map(eachEntry => {
                const eachKey = eachEntry[0]
                const eachValue = eachEntry[1]
                const seenKeys = sentKeys === "" ? eachKey : `${sentKeys}/${eachKey}`
                const seenKeysForFormInfo = seenKeys.replace(/\d+/g, '0')

                const arrayRemoveButton = (
                    <RecursiveConfirmationBox text='remove' confirmationText='are you sure you want to remove?' successMessage='removed!' float={true}
                        runAction={async () => {
                            seenFormSet(prevForm => {
                                runSameOnAll()

                                const newForm: object = JSON.parse(JSON.stringify(prevForm))
                                const keyArray = seenKeys.split('/')

                                let tempForm = newForm
                                const indexToDelete = parseInt(keyArray[keyArray.length - 1])

                                for (let i = 0; i < keyArray.length; i++) {
                                    const subKey = keyArray[i]

                                    if (i === keyArray.length - 2) {
                                        // @ts-expect-error type
                                        tempForm[subKey] = tempForm[subKey].filter((each, eachIndex) => eachIndex !== indexToDelete)

                                    } else {
                                        // @ts-expect-error type
                                        tempForm = tempForm[subKey]
                                    }
                                }

                                return newForm
                            })
                        }}
                    />
                )

                //replace camelcase key names with spaces and capitalize first letter
                const niceKeyName = eachKey.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })
                let label = niceKeyName

                const parsedNumberKey = parseInt(eachKey)
                if (!isNaN(parsedNumberKey) && parentArrayName !== undefined) {
                    label = `${parentArrayName.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })} ${parsedNumberKey + 1}`
                }

                let placeHolder = `please enter a value for ${label}`

                let element: recursiveFormMoreFormInfoElementType = { type: 'input' }
                let returnToNull = undefined
                let returnToUndefined = undefined

                if (seenMoreFormInfo[seenKeysForFormInfo] !== undefined) {
                    if (seenMoreFormInfo[seenKeysForFormInfo].label !== undefined) {
                        label = seenMoreFormInfo[seenKeysForFormInfo].label
                    }
                    if (seenMoreFormInfo[seenKeysForFormInfo].placeholder !== undefined) {
                        placeHolder = seenMoreFormInfo[seenKeysForFormInfo].placeholder
                    }
                    if (seenMoreFormInfo[seenKeysForFormInfo].element !== undefined) {
                        element = seenMoreFormInfo[seenKeysForFormInfo].element
                    }
                    if (seenMoreFormInfo[seenKeysForFormInfo].returnToNull !== undefined) {
                        returnToNull = seenMoreFormInfo[seenKeysForFormInfo].returnToNull
                    }
                    if (seenMoreFormInfo[seenKeysForFormInfo].returnToUndefined !== undefined) {
                        returnToUndefined = seenMoreFormInfo[seenKeysForFormInfo].returnToUndefined
                    }
                }

                if (typeof eachValue === 'object' && eachValue !== null) {
                    const isArray = Array.isArray(eachValue)

                    return (
                        <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", }}>
                            <RecursiveShowMore
                                label={label}
                                content={(
                                    <>
                                        {eachValue instanceof Date ? (
                                            <>
                                                <input type="date" value={eachValue.toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        seenFormSet(prevForm => {
                                                            runSameOnAll()

                                                            const newForm = { ...prevForm }
                                                            const keyArray = seenKeys.split('/')

                                                            let tempForm = newForm

                                                            for (let i = 0; i < keyArray.length; i++) {
                                                                const subKey = keyArray[i]

                                                                if (i === keyArray.length - 1) {
                                                                    // @ts-expect-error type
                                                                    tempForm[subKey] = new Date(e.target.value)

                                                                } else {
                                                                    // @ts-expect-error type
                                                                    tempForm = tempForm[subKey]
                                                                }
                                                            }

                                                            return newForm
                                                        })
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {parentArrayName && (
                                                    arrayRemoveButton
                                                )}

                                                {isArray && (
                                                    <>
                                                        <button className='mainButton' style={{ alignSelf: "flex-start" }}
                                                            onClick={() => {
                                                                if (seenArrayStarters[seenKeysForFormInfo] === undefined) {
                                                                    toast.error('Array starter for this item not found')
                                                                    return
                                                                }

                                                                seenFormSet(prevForm => {
                                                                    runSameOnAll()

                                                                    const newForm: object = JSON.parse(JSON.stringify(prevForm))
                                                                    const keyArray = seenKeys.split('/')

                                                                    let tempForm = newForm

                                                                    for (let i = 0; i < keyArray.length; i++) {
                                                                        const subKey = keyArray[i]

                                                                        if (i === keyArray.length - 1) {
                                                                            // @ts-expect-error type
                                                                            tempForm[subKey] = [...tempForm[subKey], seenArrayStarters[seenKeysForFormInfo]]
                                                                        } else {
                                                                            // @ts-expect-error type
                                                                            tempForm = tempForm[subKey]
                                                                        }
                                                                    }

                                                                    return newForm
                                                                })
                                                            }}
                                                        >add</button>

                                                        {returnToNull && eachValue.length === 0 && (
                                                            <button className='mainButton'
                                                                onClick={() => {
                                                                    seenFormSet(prevForm => {
                                                                        runSameOnAll()

                                                                        const newForm = { ...prevForm }
                                                                        const keyArray = seenKeys.split('/')

                                                                        let tempForm = newForm

                                                                        for (let i = 0; i < keyArray.length; i++) {
                                                                            const subKey = keyArray[i]

                                                                            if (i === keyArray.length - 1) {
                                                                                // @ts-expect-error type
                                                                                tempForm[subKey] = null
                                                                            } else {
                                                                                // @ts-expect-error type
                                                                                tempForm = tempForm[subKey]
                                                                            }
                                                                        }

                                                                        return newForm
                                                                    })
                                                                }}
                                                            >make null</button>
                                                        )}

                                                        {returnToUndefined && eachValue.length === 0 && (
                                                            <button className='mainButton'
                                                                onClick={() => {
                                                                    seenFormSet(prevForm => {
                                                                        runSameOnAll()

                                                                        const newForm = { ...prevForm }
                                                                        const keyArray = seenKeys.split('/')

                                                                        let tempForm = newForm

                                                                        for (let i = 0; i < keyArray.length; i++) {
                                                                            const subKey = keyArray[i]

                                                                            if (i === keyArray.length - 1) {
                                                                                // @ts-expect-error type
                                                                                tempForm[subKey] = undefined
                                                                            } else {
                                                                                // @ts-expect-error type
                                                                                tempForm = tempForm[subKey]
                                                                            }
                                                                        }

                                                                        return newForm
                                                                    })
                                                                }}
                                                            >make undefined</button>
                                                        )}
                                                    </>
                                                )}

                                                <RenderForm seenForm={eachValue} seenFormSet={seenFormSet} userInteractedSet={userInteractedSet} seenMoreFormInfo={seenMoreFormInfo} seenArrayStarters={seenArrayStarters} seenNullishStarters={seenNullishStarters} sentKeys={seenKeys} style={{ marginLeft: "1rem" }} seenFormErrors={seenFormErrors} parentArrayName={isArray ? eachKey : undefined} />
                                            </>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    )

                } else {

                    return (
                        <div key={seenKeys} style={{ display: "grid", alignContent: "flex-start", gap: ".5rem", width: "100%" }}>
                            {parentArrayName && arrayRemoveButton}

                            <label htmlFor={seenKeys}>{label}</label>

                            {(typeof eachValue === 'string' || typeof eachValue === 'number') && (
                                <>
                                    {element.type === "input" && (
                                        <>
                                            <input id={seenKeys} type={element.isNumeric ? "number" : "text"} value={eachValue} placeholder={placeHolder}
                                                onChange={(e) => {
                                                    seenFormSet(prevForm => {
                                                        runSameOnAll()

                                                        const newForm = { ...prevForm }
                                                        const keyArray = seenKeys.split('/')

                                                        let tempForm = newForm

                                                        for (let i = 0; i < keyArray.length; i++) {
                                                            const subKey = keyArray[i]

                                                            if (i === keyArray.length - 1) {
                                                                let inputVal: string | number | null | undefined = e.target.value

                                                                if (element.isNumeric) {
                                                                    inputVal = parseInt(e.target.value)

                                                                    if (element.isFloat !== undefined) {
                                                                        inputVal = parseFloat(e.target.value)
                                                                    }

                                                                    if (isNaN(inputVal)) {
                                                                        inputVal = 0
                                                                    }
                                                                }

                                                                //if return to null
                                                                if (returnToNull && e.target.value === "") {
                                                                    inputVal = null
                                                                }
                                                                //if return to null or undefined handle that
                                                                if (returnToUndefined && e.target.value === "") {
                                                                    inputVal = undefined
                                                                }

                                                                // @ts-expect-error type
                                                                tempForm[subKey] = inputVal

                                                            } else {
                                                                // @ts-expect-error type
                                                                tempForm = tempForm[subKey]
                                                            }
                                                        }

                                                        return newForm
                                                    })
                                                }}
                                            />
                                        </>
                                    )}

                                    {element.type === "textarea" && (
                                        <>
                                            <textarea id={seenKeys} rows={5} value={eachValue} placeholder={placeHolder}
                                                onChange={(e) => {
                                                    seenFormSet(prevForm => {
                                                        runSameOnAll()

                                                        const newForm = { ...prevForm }
                                                        const keyArray = seenKeys.split('/')

                                                        let tempForm = newForm

                                                        for (let i = 0; i < keyArray.length; i++) {
                                                            const subKey = keyArray[i]

                                                            if (i === keyArray.length - 1) {
                                                                let inputVal: string | number | null | undefined = e.target.value

                                                                //if return to null
                                                                if (returnToNull && e.target.value === "") {
                                                                    inputVal = null
                                                                }

                                                                //if return to null or undefined handle that
                                                                if (returnToUndefined && e.target.value === "") {
                                                                    inputVal = undefined
                                                                }

                                                                // @ts-expect-error type
                                                                tempForm[subKey] = inputVal

                                                            } else {
                                                                // @ts-expect-error type
                                                                tempForm = tempForm[subKey]
                                                            }
                                                        }

                                                        return newForm
                                                    })
                                                }}
                                            />
                                        </>
                                    )}

                                    {element.type === "image" && typeof eachValue === 'string' && (
                                        <div style={{ display: "grid", alignContent: "flex-start" }}>
                                            {eachValue !== "" && <Image alt={`${seenKeys} image`} src={eachValue} width={50} height={50} />}

                                            <input id={seenKeys} type={"text"} value={eachValue} placeholder={placeHolder}
                                                onChange={(e) => {
                                                    seenFormSet(prevForm => {
                                                        runSameOnAll()

                                                        const newForm = { ...prevForm }
                                                        const keyArray = seenKeys.split('/')

                                                        let tempForm = newForm

                                                        for (let i = 0; i < keyArray.length; i++) {
                                                            const subKey = keyArray[i]

                                                            if (i === keyArray.length - 1) {
                                                                const inputVal: string | number = e.target.value
                                                                // @ts-expect-error type
                                                                tempForm[subKey] = inputVal

                                                            } else {
                                                                // @ts-expect-error type
                                                                tempForm = tempForm[subKey]
                                                            }
                                                        }

                                                        return newForm
                                                    })
                                                }}
                                            />

                                            <button className='mainButton' style={{ justifySelf: "flex-start" }}
                                                onClick={() => {

                                                }}
                                            >upload</button>
                                        </div>
                                    )}

                                    {element.type === "color" && typeof eachValue === 'string' && (
                                        <>
                                            <input id={seenKeys} type={"color"} value={eachValue} style={{ width: "50px", height: "50px" }}
                                                onChange={(e) => {
                                                    seenFormSet(prevForm => {
                                                        runSameOnAll()

                                                        const newForm = { ...prevForm }
                                                        const keyArray = seenKeys.split('/')

                                                        let tempForm = newForm

                                                        for (let i = 0; i < keyArray.length; i++) {
                                                            const subKey = keyArray[i]

                                                            if (i === keyArray.length - 1) {
                                                                const inputVal: string | number = e.target.value
                                                                // @ts-expect-error type
                                                                tempForm[subKey] = inputVal

                                                            } else {
                                                                // @ts-expect-error type
                                                                tempForm = tempForm[subKey]
                                                            }
                                                        }

                                                        return newForm
                                                    })
                                                }}
                                            />
                                        </>
                                    )}
                                </>
                            )}

                            {typeof eachValue === 'boolean' && (
                                <>
                                    <button className='mainButton' style={{ backgroundColor: eachValue ? "rgb(var(--color1))" : "" }}
                                        onClick={() => {
                                            seenFormSet(prevForm => {
                                                runSameOnAll()

                                                const newForm = { ...prevForm }
                                                const keyArray = seenKeys.split('/')

                                                let tempForm = newForm

                                                for (let i = 0; i < keyArray.length; i++) {
                                                    const subKey = keyArray[i]

                                                    if (i === keyArray.length - 1) {
                                                        // @ts-expect-error type
                                                        tempForm[subKey] = !tempForm[subKey]

                                                    } else {
                                                        // @ts-expect-error type
                                                        tempForm = tempForm[subKey]
                                                    }
                                                }

                                                return newForm
                                            })
                                        }}
                                    >{eachValue.toString()}</button>
                                </>
                            )}

                            {eachValue === null && (
                                <>
                                    <button className='mainButton'
                                        onClick={() => {
                                            seenFormSet(prevForm => {
                                                runSameOnAll()

                                                const newForm = { ...prevForm }
                                                const keyArray = seenKeys.split('/')

                                                //check nullish starters
                                                if (returnToNull && seenNullishStarters[seenKeys] === undefined) {
                                                    toast.error("not seeing nullish starter")
                                                    return prevForm
                                                }

                                                let tempForm = newForm

                                                for (let i = 0; i < keyArray.length; i++) {
                                                    const subKey = keyArray[i]

                                                    if (i === keyArray.length - 1) {
                                                        // @ts-expect-error type
                                                        tempForm[subKey] = seenNullishStarters[seenKeys]
                                                    } else {
                                                        // @ts-expect-error type
                                                        tempForm = tempForm[subKey]
                                                    }
                                                }

                                                return newForm
                                            })
                                        }}
                                    >null</button>
                                </>
                            )}

                            {eachValue === 'undefined' && (
                                <>
                                    <button className='mainButton'
                                        onClick={() => {
                                            seenFormSet(prevForm => {
                                                runSameOnAll()

                                                const newForm = { ...prevForm }
                                                const keyArray = seenKeys.split('/')

                                                //check nullish starters
                                                if (returnToUndefined && seenNullishStarters[seenKeys] === undefined) {
                                                    toast.error("not seeing nullish starter")
                                                    return prevForm
                                                }

                                                let tempForm = newForm

                                                for (let i = 0; i < keyArray.length; i++) {
                                                    const subKey = keyArray[i]

                                                    if (i === keyArray.length - 1) {
                                                        // @ts-expect-error type
                                                        tempForm[subKey] = seenNullishStarters[seenKeys]
                                                    } else {
                                                        // @ts-expect-error type
                                                        tempForm = tempForm[subKey]
                                                    }
                                                }

                                                return newForm
                                            })
                                        }}
                                    >undefined</button>
                                </>
                            )}

                            {seenFormErrors[seenKeys] !== undefined && (
                                <p style={{ color: "red" }}>{seenFormErrors[seenKeys]}</p>
                            )}
                        </div>
                    )
                }
            })}
        </div>
    )
}
