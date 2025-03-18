"use client"
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import styles from "./style.module.css"
import { newWebsite, newWebsiteSchema, updateWebsiteSchema, website, websiteSchema } from '@/types'
import { addWebsite, refreshWebsitePath, updateTheWebsite } from '@/serverFunctions/handleWebsites'
import { useRouter } from 'next/navigation'
import TextInput from '../textInput/TextInput'
import TextArea from '../textArea/TextArea'
import { deepClone, makeValidVariableName } from '@/utility/utility'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'

export default function AddEditWebsite({ sentWebsite }: { sentWebsite?: website }) {
    const router = useRouter()

    const initialFormObj: newWebsite = {
        name: "",
    }

    const [formObj, formObjSet] = useState<Partial<website>>(deepClone(sentWebsite === undefined ? initialFormObj : updateWebsiteSchema.parse(sentWebsite)))
    type websiteKeys = keyof Partial<website>

    type moreFormInfoType = Partial<{
        [key in websiteKeys]: {
            label?: string,
            placeHolder?: string,
            type?: string,
            required?: boolean
            inputType: "input" | "textarea",
        }
    }>

    const [moreFormInfo,] = useState<moreFormInfoType>({
        "name": {
            label: "name",
            inputType: "input",
            placeHolder: "Enter website name",
        },
        "title": {
            label: "title",
            inputType: "input",
            placeHolder: "Enter website title",
        },
        "description": {
            label: "description",
            inputType: "textarea",
            placeHolder: "Enter website description",
        },
        "fonts": {
            label: "fonts",
            inputType: "input",
            placeHolder: "Enter website fonts",
        },
    });

    const [formErrors, formErrorsSet] = useState<Partial<{
        [key in websiteKeys]: string
    }>>({})

    function checkIfValid(seenFormObj: Partial<website>, seenName: keyof Partial<website>, schema: typeof websiteSchema) {
        //@ts-expect-error type
        const testSchema = schema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }
                delete newObj[seenName]

                return newObj
            })

        } else {
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }

                let errorMessage = ""

                JSON.parse(testSchema.error.message).forEach((eachErrorObj: Error) => {
                    errorMessage += ` ${eachErrorObj.message}`
                })

                newObj[seenName] = errorMessage

                return newObj
            })
        }
    }

    async function handleSubmit() {
        try {
            if (sentWebsite === undefined) {
                //new website
                const validatedNewWebsite = newWebsiteSchema.parse(formObj)

                const addedWebsite = await addWebsite(validatedNewWebsite)

                toast.success(`Created Website ${formObj.name}!`)
                formObjSet(deepClone(initialFormObj))

                setTimeout(() => {
                    router.push(`/websites/${addedWebsite.id}`)
                }, 2000);

            } else {
                //update website
                const validatedUpdateWebsite = updateWebsiteSchema.parse(formObj)
                await updateTheWebsite(sentWebsite.id, validatedUpdateWebsite)

                //refresh
                refreshWebsitePath({ id: sentWebsite.id })

                toast.success("updated website!")
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    //respond to changes above
    useEffect(() => {
        if (sentWebsite === undefined) return

        formObjSet(updateWebsiteSchema.parse(sentWebsite))
    }, [sentWebsite])

    return (
        <form className={styles.form} action={() => { }}>
            {Object.entries(formObj).map(eachEntry => {
                const eachKey = eachEntry[0] as websiteKeys

                if (eachKey === "fromUser" || eachKey === "userUploadedImages" || eachKey === "pages" || eachKey === "usedComponents") return null

                if (moreFormInfo[eachKey] === undefined) return null

                if (eachKey === "fonts" && formObj.fonts !== undefined) {
                    return (
                        <React.Fragment key={eachKey}>
                            <label>Fonts</label>

                            <div className={`${styles.fontsCont} snap`}>
                                {formObj.fonts.map((eachFont, eachFontIndex) => {
                                    return (
                                        <div className={styles.fontCont} key={eachFontIndex} >
                                            <button className='secondaryButton'
                                                onClick={() => {
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.fonts === undefined) return prevFormObj

                                                        newFormObj.fonts = newFormObj.fonts.filter((ef, efIndex) => {
                                                            return efIndex !== eachFontIndex
                                                        })

                                                        return newFormObj
                                                    })
                                                }}
                                            >delete</button>

                                            <TextInput
                                                name={eachKey + "importName"}
                                                value={eachFont.importName}
                                                type={"text"}
                                                label={"Website font name"}
                                                placeHolder={"Enter website font - case sensitive"}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.fonts === undefined) return prevFormObj

                                                        newFormObj.fonts[eachFontIndex].importName = e.target.value
                                                        return newFormObj
                                                    })
                                                }}
                                                onBlur={() => { checkIfValid(formObj, eachKey, websiteSchema) }}
                                                errors={formErrors[eachKey]}
                                            />

                                            {formObj.fonts !== undefined && formObj.fonts[eachFontIndex].importName !== "" && (
                                                <p>css: var(--font-{makeValidVariableName(eachFont.importName)})</p>
                                            )}

                                            <TextInput
                                                name={eachKey + "subset"}
                                                value={eachFont.subsets.join(",")}
                                                type={"text"}
                                                label={"Website font subset"}
                                                placeHolder={"enter font subsets - e.g latin"}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.fonts === undefined) return prevFormObj

                                                        newFormObj.fonts[eachFontIndex].subsets = e.target.value.split(",")
                                                        return newFormObj
                                                    })

                                                }}
                                                onBlur={() => {
                                                    checkIfValid(formObj, eachKey, websiteSchema)
                                                }}
                                                errors={formErrors[eachKey]}
                                            />

                                            <TextInput
                                                name={eachKey + "weight"}
                                                value={eachFont.weights !== null ? eachFont.weights.join(",") : ""}
                                                type={"text"}
                                                label={"enter font weight"}
                                                placeHolder={"blank for variable fonts or 300,400...etc"}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    formObjSet(prevFormObj => {
                                                        const newFormObj = { ...prevFormObj }
                                                        if (newFormObj.fonts === undefined) return prevFormObj

                                                        newFormObj.fonts[eachFontIndex].weights = e.target.value.split(",")

                                                        if (e.target.value === "") {
                                                            newFormObj.fonts[eachFontIndex].weights = null
                                                        }
                                                        return newFormObj
                                                    })
                                                }}
                                                onBlur={() => {
                                                    checkIfValid(formObj, eachKey, websiteSchema)
                                                }}
                                                errors={formErrors[eachKey]}
                                            />
                                        </div>
                                    )
                                })}

                                <button className='mainButton' style={{ alignSelf: "center" }}
                                    onClick={() => {
                                        formObjSet(prevFormObj => {
                                            const newFormObj = { ...prevFormObj }
                                            if (newFormObj.fonts === undefined) return prevFormObj

                                            newFormObj.fonts = [...newFormObj.fonts, {
                                                importName: "",
                                                subsets: [],
                                                weights: null
                                            }]
                                            return newFormObj
                                        })
                                    }}
                                >add</button>
                            </div>
                        </React.Fragment>
                    )
                }

                return (
                    <React.Fragment key={eachKey}>
                        {moreFormInfo[eachKey].inputType === "input" ? (
                            <TextInput
                                name={eachKey}
                                value={`${formObj[eachKey]}`}
                                type={moreFormInfo[eachKey].type}
                                label={moreFormInfo[eachKey].label}
                                placeHolder={moreFormInfo[eachKey].placeHolder}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    formObjSet(prevFormObj => {
                                        const newFormObj = { ...prevFormObj }
                                        if (eachKey === "fonts" || eachKey === "authorisedUsers") return prevFormObj

                                        newFormObj[eachKey] = e.target.value
                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, websiteSchema) }}
                                errors={formErrors[eachKey]}
                            />
                        ) : moreFormInfo[eachKey].inputType === "textarea" ? (
                            <TextArea
                                name={eachKey}
                                value={`${formObj[eachKey]}`}
                                label={moreFormInfo[eachKey].label}
                                placeHolder={moreFormInfo[eachKey].placeHolder}
                                onInput={(e) => {
                                    formObjSet(prevFormObj => {
                                        const newFormObj = { ...prevFormObj }
                                        if (eachKey === "authorisedUsers") return prevFormObj

                                        //@ts-expect-error type
                                        newFormObj[eachKey] = e.target.value
                                        return newFormObj
                                    })
                                }}
                                onBlur={() => { checkIfValid(formObj, eachKey, websiteSchema) }}
                                errors={formErrors[eachKey]}
                            />
                        ) : null}
                    </React.Fragment>
                )
            })}

            <button className='mainButton' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >Submit</button>
        </form>
    )
}
