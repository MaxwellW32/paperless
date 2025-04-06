import React from 'react'
import styles from "./style.module.css"
import ConfirmationBox from '@/components/confirmationBox/ConfirmationBox'

export default function SimpleDisplayStringArray({ seenArray, removeFunction, updateFunction, onBlur, addFunction, errors, label, removeText, addText, keyName, placeholder }: { seenArray: string[], removeFunction: (indexToUpdate: number) => void, updateFunction: (text: string, indexToUpdate: number) => void, onBlur?: () => void, addFunction: () => void, errors?: string, label?: string, removeText?: string, addText?: string, keyName: string, placeholder: string }) {

    return (
        <div className={styles.arrayCont}>
            <label>{label === undefined ? keyName : label}</label>

            <div className={`${styles.mapCont} snap`}>
                {seenArray.map((eachString, eachStringIndex) => {
                    return (
                        <div key={eachStringIndex} className={styles.mapEachCont}>
                            <ConfirmationBox
                                text={removeText === undefined ? "" : removeText}
                                confirmationText='are you sure you want to delete?'
                                successMessage='deleted!'
                                float={true}
                                confirmationDivProps={{
                                    style: {
                                        position: "absolute"
                                    }
                                }}
                                buttonProps={{
                                    className: "button2",
                                    style: {
                                        display: "flex", gap: ".5rem"
                                    }
                                }}
                                icon={
                                    <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"> <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                                }
                                runAction={() => {
                                    removeFunction(eachStringIndex)
                                }}
                            />

                            <input type='text' value={eachString} placeholder={placeholder}
                                onChange={e => {
                                    updateFunction(e.target.value, eachStringIndex)
                                }}

                                onBlur={() => {
                                    if (onBlur !== undefined) {
                                        onBlur()
                                    }
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            <button className='button1'
                onClick={addFunction}
            >{addText === undefined ? `add ${keyName}` : addText}</button>

            {errors !== undefined && (
                <>
                    <p className='errorText'>{errors}</p>
                </>
            )}
        </div>
    )
}
