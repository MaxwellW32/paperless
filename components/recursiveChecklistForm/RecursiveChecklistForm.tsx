import { formInputType, formType } from "@/types";
import { deepClone } from "@/utility/utility";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import ChecklistShowMore from "./checklistShowMore/ChecklistShowMore";
import styles from "./style.module.css"

export function MakeRecursiveChecklistForm({ seenForm, handleFormUpdate }: { seenForm: formType, handleFormUpdate: (updatedForm: formType) => void }) {
    const [formData, formDataSet] = useState<formType>(deepClone(seenForm));
    const updating = useRef(false)

    //react to changes from above
    useEffect(() => {
        updating.current = true

        formDataSet(deepClone(seenForm))

    }, [seenForm])

    //send changes up
    useEffect(() => {
        if (updating.current) {
            updating.current = false
            return
        }

        if (handleFormUpdate === undefined) return

        handleFormUpdate(formData)
    }, [formData])

    return (
        <>
            <RecursiveMakeChecklistForm formData={formData} formDataSet={formDataSet} />

            {/* <pre>{JSON.stringify(formData, null, 2)}</pre> */}
        </>
    );
}
function RecursiveMakeChecklistForm({ formData, formDataSet, sentKeys = "", parentArrayName, ...elProps }: { formData: formType, formDataSet: React.Dispatch<React.SetStateAction<formType>>, sentKeys?: string, parentArrayName?: string } & React.HTMLAttributes<HTMLDivElement>) {
    const handleChange = (path: string, value: unknown) => {
        formDataSet(prev => {
            const newData = deepClone(prev);

            const keyArray = path.split('/')

            let tempForm = newData

            for (let i = 0; i < keyArray.length; i++) {
                const subKey = keyArray[i]

                if (i === keyArray.length - 1) {
                    // @ts-expect-error type
                    tempForm[subKey] = value

                } else {
                    // @ts-expect-error type
                    tempForm = tempForm[subKey]
                }
            }

            return newData
        });
    };

    const addField = (path: string, newKeyName: string, typeToAdd: formType[string]["type"], inputTypeSelection: formInputType["data"]["type"]) => {
        formDataSet(prev => {
            const newData = deepClone(prev);

            const keyArray = path.split('/')

            const newFormDataToAdd = typeToAdd === "input" ? { type: "input", label: "", data: inputTypeSelection === "string" ? { type: "string", value: "", placeholder: "", useTextArea: false } : inputTypeSelection === "number" ? { type: "number", value: 0, placeholder: "", isFloat: false } : inputTypeSelection === "boolean" ? { type: "boolean", value: false } : { type: "date", value: (new Date).toISOString().split('T')[0] }, required: false }
                : typeToAdd === "object" ? { type: "object", label: "", data: {}, required: false }
                    : { type: "array", label: "", arrayStarter: {}, arrayAddLabel: "", data: [], required: false };

            let tempForm = newData

            //recursive search
            for (let i = 0; i < keyArray.length; i++) {
                const subKey = keyArray[i]

                if (i === keyArray.length - 1) {
                    if (subKey === "") {
                        if (newKeyName === "") {
                            toast.error("add valid keyname")
                            return prev
                        }

                        // @ts-expect-error type
                        tempForm[newKeyName] = newFormDataToAdd;

                    } else {
                        if (newKeyName === "") {
                            toast.error("add valid keyname")
                            return prev
                        }

                        // @ts-expect-error type
                        tempForm[subKey][newKeyName] = newFormDataToAdd;
                    }

                } else {
                    // @ts-expect-error type
                    tempForm = tempForm[subKey]
                }
            }

            return newData
        });
    };

    return (
        <div  {...elProps} style={{ display: "grid", gap: "1rem", alignContent: "flex-start", overflow: "auto", ...elProps?.style }} className={`${parentArrayName ? "snap" : ""} ${elProps?.className ?? ""}`}>
            {Object.entries(formData).map(eachEntry => {
                const eachKey = eachEntry[0]
                const eachFormDataValue = eachEntry[1]

                const seenKeys = sentKeys === "" ? eachKey : `${sentKeys}/${eachKey}`

                //replace camelcase key names with spaces and capitalize first letter
                let niceKeyName = eachKey.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })

                const parsedNumberKey = parseInt(eachKey)
                if (!isNaN(parsedNumberKey) && parentArrayName !== undefined) {
                    niceKeyName = `${parentArrayName.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })} ${parsedNumberKey + 1}`
                }

                return (
                    <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", }}>
                        {eachFormDataValue.type === "input" && (
                            <>
                                <label>{niceKeyName}</label>

                                <ChecklistShowMore
                                    label={(
                                        <label>settings</label>
                                    )}
                                    content={(
                                        <>
                                            <label>set label</label>

                                            <input type="text" value={eachFormDataValue.label} placeholder="set label client will see"
                                                onChange={(e) => {
                                                    handleChange(seenKeys, { ...eachFormDataValue, label: e.target.value })
                                                }}
                                            />

                                            {(eachFormDataValue.data.type === "string" || eachFormDataValue.data.type === "number") && (
                                                <>
                                                    <label>set placeholder</label>

                                                    <input type="text" value={eachFormDataValue.data.placeholder} placeholder="set placeholder text"
                                                        onChange={(e) => {
                                                            handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, placeholder: e.target.value } })
                                                        }}
                                                    />

                                                </>
                                            )}

                                            {eachFormDataValue.data.type === "string" && (
                                                <button className="button1"
                                                    onClick={() => {
                                                        //@ts-expect-error type
                                                        handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, useTextArea: !eachFormDataValue.data.useTextArea } })
                                                    }}
                                                >{eachFormDataValue.data.useTextArea ? "textarea" : "input"}</button>
                                            )}

                                            <label>value</label>

                                            {eachFormDataValue.data.type === "string" ? (
                                                <>
                                                    {eachFormDataValue.data.useTextArea ? (
                                                        <textarea rows={5} placeholder={`${niceKeyName} starter value here`}
                                                            value={eachFormDataValue.data.value}
                                                            onChange={(e) => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: e.target.value } })
                                                            }}
                                                        />

                                                    ) : (
                                                        <input
                                                            type={"text"}
                                                            value={eachFormDataValue.data.value}
                                                            placeholder={`${niceKeyName} starter value here`}
                                                            onChange={(e) => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: e.target.value } })
                                                            }}
                                                        />
                                                    )}
                                                </>

                                            ) : eachFormDataValue.data.type === "number" ? (
                                                <input
                                                    type={"number"}
                                                    value={eachFormDataValue.data.value}
                                                    onChange={(e) => {
                                                        //@ts-expect-error type
                                                        let newValue = eachFormDataValue.data.isFloat ? parseFloat(e.target.value) : parseInt(e.target.value)

                                                        if (isNaN(newValue)) {
                                                            newValue = 0
                                                        }

                                                        handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: newValue } })
                                                    }}
                                                />

                                            ) : eachFormDataValue.data.type === "boolean" ? (
                                                <button className="button1" style={{ backgroundColor: eachFormDataValue.data.value ? "rgb(var(--color1))" : "" }}
                                                    onClick={() => handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: !eachFormDataValue.data.value } })}>
                                                    Toggle
                                                </button>

                                            ) : eachFormDataValue.data.type === "date" ? (
                                                <input
                                                    type="date"
                                                    value={eachFormDataValue.data.value}
                                                    onChange={(e) => handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: new Date(e.target.value).toISOString().split('T')[0] } })}
                                                />

                                            ) : null}

                                            {eachFormDataValue.data.type === "number" && (
                                                <button className="button1"
                                                    onClick={() => {
                                                        //@ts-expect-error type
                                                        handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, isFloat: !eachFormDataValue.data.isFloat } })
                                                    }}
                                                >{eachFormDataValue.data.isFloat ? "float" : "integer"}</button>
                                            )}

                                            <button className="button1" style={{ backgroundColor: eachFormDataValue.required ? "rgb(var(--color1))" : "" }}
                                                onClick={() => {
                                                    handleChange(seenKeys, { ...eachFormDataValue, required: !eachFormDataValue.required })
                                                }}
                                            >{eachFormDataValue.required ? "required" : "not required"}</button>
                                        </>
                                    )}
                                />
                            </>
                        )}

                        {eachFormDataValue.type === "object" && (
                            <>
                                <ChecklistShowMore
                                    label={(
                                        <label>{niceKeyName}</label>
                                    )}
                                    content={(
                                        <>
                                            <ChecklistShowMore
                                                label={(
                                                    <label>object settings</label>
                                                )}
                                                content={(
                                                    <>
                                                        <label>set label</label>

                                                        <input type="text" value={eachFormDataValue.label} placeholder="set label client will see"
                                                            onChange={(e) => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, label: e.target.value })
                                                            }}
                                                        />

                                                        <button className="button1" style={{ backgroundColor: eachFormDataValue.required ? "rgb(var(--color1))" : "" }}
                                                            onClick={() => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, required: !eachFormDataValue.required })
                                                            }}
                                                        >{eachFormDataValue.required ? "required" : "not required"}</button>
                                                    </>
                                                )}
                                            />

                                            <RecursiveMakeChecklistForm formData={eachFormDataValue.data} formDataSet={formDataSet} sentKeys={`${seenKeys}/data`} style={{ marginTop: "2rem" }} />
                                        </>
                                    )}
                                />
                            </>
                        )}

                        {eachFormDataValue.type === "array" && (
                            <>
                                <ChecklistShowMore
                                    label={(
                                        <label>{niceKeyName}</label>
                                    )}
                                    content={(
                                        <>
                                            <ChecklistShowMore
                                                label={(
                                                    <label>array settings</label>
                                                )}
                                                content={(
                                                    <>
                                                        <label>set label</label>

                                                        <input type="text" value={eachFormDataValue.label} placeholder="set label client will see"
                                                            onChange={(e) => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, label: e.target.value })
                                                            }}
                                                        />

                                                        <label>Add to array button label</label>

                                                        <input type="text" value={eachFormDataValue.arrayAddLabel} placeholder={`E.g "Add tape"`}
                                                            onChange={(e) => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, arrayAddLabel: e.target.value })
                                                            }}
                                                        />

                                                        <button className="button1" style={{ backgroundColor: eachFormDataValue.required ? "rgb(var(--color1))" : "" }}
                                                            onClick={() => {
                                                                handleChange(seenKeys, { ...eachFormDataValue, required: !eachFormDataValue.required })
                                                            }}
                                                        >{eachFormDataValue.required ? "required" : "not required"}</button>
                                                    </>
                                                )}
                                            />

                                            <RecursiveMakeChecklistForm style={{ marginTop: "2rem" }} formData={eachFormDataValue.arrayStarter} formDataSet={formDataSet} sentKeys={`${seenKeys}/arrayStarter`} parentArrayName={eachKey} />
                                        </>
                                    )}
                                />
                            </>
                        )}
                    </div>
                )
            })}

            <ButtonSelectionOptions seenKeys={sentKeys} addField={addField} />
        </div>
    );
}
function ButtonSelectionOptions({ seenKeys, addField }: {
    seenKeys: string, addField: (path: string, newKeyName: string, typeToAdd: formType[string]["type"], inputTypeSelection: formInputType["data"]["type"]) => void
}) {
    const fieldTypeOptions: formType[string]["type"][] = ["input", "object", "array"];
    const [fieldTypeSelection, fieldTypeSelectionSet] = useState<formType[string]["type"]>("input")
    const inputTypeOptions: formInputType["data"]["type"][] = ["string", "number", "boolean", "date"];
    const [inputTypeSelection, inputTypeSelectionSet] = useState<formInputType["data"]["type"]>("string")
    const [newKeyName, newKeyNameSet] = useState("");

    return (
        <div style={{ display: "grid", alignContent: "flex-start" }}>
            <input
                type="text"
                placeholder="Enter new key"
                value={newKeyName}
                onChange={(e) => newKeyNameSet(e.target.value.replace(/ /g, ""))}
            />

            <div style={{ display: "flex", flexWrap: "wrap" }}>
                {fieldTypeOptions.map(eachFieldTypeOption => (
                    <button key={eachFieldTypeOption} className="button2" style={{ backgroundColor: eachFieldTypeOption === fieldTypeSelection ? "rgb(var(--color1))" : "" }}
                        onClick={() => {
                            fieldTypeSelectionSet(eachFieldTypeOption)
                        }}
                    >
                        {eachFieldTypeOption}
                    </button>
                ))}
            </div>

            <div style={{ display: fieldTypeSelection === "input" ? "flex" : "none", flexWrap: "wrap" }}>
                {inputTypeOptions.map(eachInputTypeOption => (
                    <button key={eachInputTypeOption} className="button2" style={{ backgroundColor: eachInputTypeOption === inputTypeSelection ? "rgb(var(--color1))" : "" }}
                        onClick={() => inputTypeSelectionSet(eachInputTypeOption)}
                    >
                        {eachInputTypeOption}
                    </button>
                ))}
            </div>

            <button className="button1"
                onClick={() => {
                    addField(seenKeys, newKeyName, fieldTypeSelection, inputTypeSelection)

                    newKeyNameSet("");
                }}
            >Add</button>
        </div>
    )
}








export function ReadRecursiveChecklistForm({ seenForm, handleFormUpdate }: { seenForm: formType, handleFormUpdate: (updatedForm: formType) => void }) {
    const [formData, setFormData] = useState<formType>(deepClone(seenForm));
    const updating = useRef(false)

    //react to changes from above
    useEffect(() => {
        updating.current = true

        setFormData(deepClone(seenForm))

    }, [seenForm])

    //send changes up
    useEffect(() => {
        if (updating.current) {
            updating.current = false
            return
        }

        if (handleFormUpdate === undefined) return

        handleFormUpdate(formData)
    }, [formData])

    return (
        <>
            <RecursiveReadChecklistForm formData={formData} setFormData={setFormData} />

            {/* <pre>{JSON.stringify(formData, null, 2)}</pre> */}
        </>
    );
}
function RecursiveReadChecklistForm({ formData, setFormData, sentKeys = "", parentArrayName, ...elProps }: { formData: formType, setFormData: React.Dispatch<React.SetStateAction<formType>>, sentKeys?: string, parentArrayName?: string } & React.HTMLAttributes<HTMLDivElement>) {
    const handleChange = (path: string, value: unknown) => {
        setFormData(prev => {
            const newData = deepClone(prev);

            const keyArray = path.split('/')

            let tempForm = newData

            for (let i = 0; i < keyArray.length; i++) {
                const subKey = keyArray[i]

                if (i === keyArray.length - 1) {
                    // @ts-expect-error type
                    tempForm[subKey] = value

                } else {
                    // @ts-expect-error type
                    tempForm = tempForm[subKey]
                }
            }

            return newData
        });
    };

    return (
        <div  {...elProps} style={{ display: "grid", gap: "1rem", alignContent: "flex-start", overflow: "auto", ...elProps?.style }} className={`${parentArrayName ? "snap" : ""} ${elProps?.className ?? ""}`}>
            {Object.entries(formData).map(eachEntry => {
                const eachKey = eachEntry[0]
                const eachFormDataValue = eachEntry[1]

                const seenKeys = sentKeys === "" ? eachKey : `${sentKeys}/${eachKey}`

                //replace camelcase key names with spaces and capitalize first letter
                let niceKeyName = eachKey.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })

                const parsedNumberKey = parseInt(eachKey)
                if (!isNaN(parsedNumberKey) && parentArrayName !== undefined) {
                    niceKeyName = `${parentArrayName.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })} ${parsedNumberKey + 1}`
                }

                return (
                    <div key={eachKey} style={{ display: "grid", alignContent: "flex-start", }}>
                        {eachFormDataValue.type === "input" && (
                            <>
                                <label className={styles.labelCont}>{eachFormDataValue.label} {eachFormDataValue.required ? <p className={styles.required}>required</p> : ""}</label>

                                {eachFormDataValue.data.type === "string" ? (
                                    <>
                                        {eachFormDataValue.data.useTextArea ? (
                                            <textarea rows={5} placeholder={eachFormDataValue.data.placeholder}
                                                value={eachFormDataValue.data.value}
                                                onChange={(e) => {
                                                    handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: e.target.value } })
                                                }}
                                            />

                                        ) : (
                                            <input
                                                type={"text"}
                                                value={eachFormDataValue.data.value}
                                                placeholder={eachFormDataValue.data.placeholder}
                                                onChange={(e) => {
                                                    handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: e.target.value } })
                                                }}
                                            />
                                        )}
                                    </>

                                ) : eachFormDataValue.data.type === "number" ? (
                                    <input
                                        type={"number"}
                                        value={eachFormDataValue.data.value}
                                        placeholder={eachFormDataValue.data.placeholder}
                                        onChange={(e) => {
                                            //@ts-expect-error type
                                            let newValue = eachFormDataValue.data.isFloat ? parseFloat(e.target.value) : parseInt(e.target.value)

                                            if (isNaN(newValue)) {
                                                newValue = 0
                                            }

                                            handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: newValue } })
                                        }}
                                    />

                                ) : eachFormDataValue.data.type === "boolean" ? (
                                    <button className="button1" style={{ backgroundColor: eachFormDataValue.data.value ? "rgb(var(--color1))" : "" }}
                                        onClick={() => handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: !eachFormDataValue.data.value } })}>
                                        Toggle
                                    </button>

                                ) : eachFormDataValue.data.type === "date" ? (
                                    <input
                                        type="date"
                                        value={eachFormDataValue.data.value}
                                        onChange={(e) => handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: new Date(e.target.value).toISOString().split('T')[0] } })}
                                    />

                                ) : null}
                            </>
                        )}

                        {eachFormDataValue.type === "object" && (
                            <>
                                <ChecklistShowMore
                                    label={(
                                        <label className={styles.labelCont}>{eachFormDataValue.label} {eachFormDataValue.required ? <p className={styles.required}>required</p> : ""}</label>
                                    )}
                                    content={(
                                        <>
                                            <RecursiveReadChecklistForm key={eachKey} formData={eachFormDataValue.data} setFormData={setFormData} sentKeys={`${seenKeys}/data`} style={{ marginLeft: "2rem" }} />
                                        </>
                                    )}
                                />
                            </>
                        )}

                        {eachFormDataValue.type === "array" && (
                            <>
                                <ChecklistShowMore
                                    label={(
                                        <label className={styles.labelCont}>{eachFormDataValue.label} {eachFormDataValue.required ? <p className={styles.required}>required</p> : ""}</label>
                                    )}
                                    content={(
                                        <>
                                            <div className="snap" style={{ display: "grid", gridAutoColumns: "min(400px, 90%)", gridAutoFlow: "column", gap: "1rem", overflow: "auto", paddingBlock: "1rem" }} >
                                                {eachFormDataValue.data.map((eachFormData, eachFormDataIndex) => {
                                                    return (
                                                        <RecursiveReadChecklistForm key={eachFormDataIndex} formData={eachFormData} setFormData={setFormData} sentKeys={`${seenKeys}/data/${eachFormDataIndex}`} parentArrayName={eachKey} />
                                                    )
                                                })}
                                            </div>

                                            <button className="button1" style={{ marginTop: "1rem" }}
                                                onClick={() => {
                                                    handleChange(seenKeys, { ...eachFormDataValue, data: [...eachFormDataValue.data, eachFormDataValue.arrayStarter] })
                                                }}
                                            >{eachFormDataValue.arrayAddLabel !== "" ? eachFormDataValue.arrayAddLabel : `Add to ${niceKeyName}`}</button>
                                        </>
                                    )}
                                />
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    );
}