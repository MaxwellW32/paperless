import { formInputType, formType } from "@/types";
import { deepClone } from "@/utility/utility";
import React, { useState } from "react";
import toast from "react-hot-toast";
import ShowMore from "../showMore/ShowMore";

export default function Test() {
    const [formData, setFormData] = useState<formType>({
        //     name: { type: "input", label: "Name", placeholder: "Enter name", data: { type: "string", value: "Maxwell" } },
        //     age: { type: "input", label: "Age", placeholder: "Enter age", data: { type: "number", value: 0 } },
        //     address: {
        //         type: "object",
        //         label: "Address",
        //         data: {
        //             street: { type: "input", label: "Street", placeholder: "Enter street", data: { type: "string", value: "" } },
        //             city: { type: "input", label: "City", placeholder: "Enter city", data: { type: "string", value: "" } }
        //         }
        //     },
        //     contacts: {
        //         type: "array",
        //         label: "Contacts",
        //         data: []
        //     }
    });

    return (
        <div>
            <h2>Dynamic Recursive Form</h2>

            <RecursiveForm formData={formData} setFormData={setFormData} />

            <pre style={{ marginTop: "5rem" }}>{JSON.stringify(formData, null, 2)}</pre>
        </div>
    );
}


function RecursiveForm({ formData, setFormData, sentKeys = "", parentArrayName, ...elProps }: { formData: formType, setFormData: React.Dispatch<React.SetStateAction<formType>>, sentKeys?: string, parentArrayName?: string } & React.HTMLAttributes<HTMLDivElement>) {

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

    const addField = (path: string, parentType: formType[string]["type"], newKeyName: string, typeToAdd: formType[string]["type"], inputTypeSelection: formInputType["data"]["type"]) => {
        setFormData(prev => {
            const newData = deepClone(prev);

            const keyArray = path.split('/')

            const newFormDataToAdd = typeToAdd === "input" ? { type: "input", label: "", placeholder: "", data: inputTypeSelection === "string" ? { type: "string", value: "" } : inputTypeSelection === "number" ? { type: "number", value: 0 } : inputTypeSelection === "boolean" ? { type: "boolean", value: false } : { type: "date", value: (new Date).toISOString().split('T')[0] } }
                : typeToAdd === "object" ? { type: "object", label: "", data: {} }
                    : { type: "array", label: "", data: [] };

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
        <div  {...elProps} style={{ display: "grid", gap: "1rem", ...(parentArrayName ? { gridAutoColumns: "90%", gridAutoFlow: "column" } : { alignContent: "flex-start" }), overflow: "auto", ...elProps?.style }} className={`${parentArrayName ? "snap" : ""} ${elProps?.className ?? ""}`}>
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
                    <div key={eachKey} style={{ display: "grid", alignContent: "flex-start" }}>
                        {eachFormDataValue.type === "input" && (
                            <>
                                <label>{niceKeyName}:</label>

                                {eachFormDataValue.data.type === "string" || eachFormDataValue.data.type === "number" ? (
                                    <input
                                        type={eachFormDataValue.data.type === "string" ? "text" : "number"}
                                        value={eachFormDataValue.data.value}
                                        onChange={(e) => handleChange(seenKeys, { ...eachFormDataValue, data: { ...eachFormDataValue.data, value: e.target.value } })}
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
                                <ShowMore
                                    label={`${niceKeyName}:`}
                                    content={(
                                        <>
                                            <RecursiveForm key={eachKey} formData={eachFormDataValue.data} setFormData={setFormData} sentKeys={`${seenKeys}/data`} style={{ marginLeft: "2rem" }} />
                                        </>
                                    )}
                                />
                            </>
                        )}

                        {eachFormDataValue.type === "array" && (
                            <>
                                <ShowMore
                                    label={`${niceKeyName}:`}
                                    content={(
                                        <>
                                            <RecursiveForm formData={eachFormDataValue.arrayStarter} setFormData={setFormData} sentKeys={`${seenKeys}/arrayStarter`} parentArrayName={eachKey} />
                                        </>
                                    )}
                                />

                                <button>show in array</button>
                            </>
                        )}
                    </div>
                )
            })}

            <ButtonSelectionOptions seenKeys={sentKeys} parentType={parentArrayName !== undefined ? "array" : "object"} addField={addField} parentArrayName={parentArrayName} />
        </div>
    );
}

function ButtonSelectionOptions({ seenKeys, parentType, addField, parentArrayName }: {
    seenKeys: string, parentType: formType[string]["type"], addField: (path: string, parentType: formType[string]["type"], newKeyName: string, typeToAdd: formType[string]["type"], inputTypeSelection: formInputType["data"]["type"]) => void, parentArrayName?: string
}) {
    const fieldTypeOptions: formType[string]["type"][] = ["input", "object", "array"];
    const [fieldTypeSelection, fieldTypeSelectionSet] = useState<formType[string]["type"]>("input")
    const inputTypeOptions: formInputType["data"]["type"][] = ["string", "number", "boolean", "date"];
    const [inputTypeSelection, inputTypeSelectionSet] = useState<formInputType["data"]["type"]>("string")
    const [newKeyName, newKeyNameSet] = useState("");

    return (
        <div style={{ display: "grid", alignContent: "flex-start" }}>
            {parentArrayName === undefined && (
                <input
                    type="text"
                    placeholder="Enter new key"
                    value={newKeyName}
                    onChange={(e) => newKeyNameSet(e.target.value.replace(/ /g, ""))}
                />
            )}

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
                    addField(seenKeys, parentType, newKeyName, fieldTypeSelection, inputTypeSelection)

                    newKeyNameSet("");
                }}
            >Add</button>
        </div>
    )
}
