"use client"
import { useState } from "react"
import styles from "./styles.module.css"

export default function RecursiveShowMore({ label, content, svgColor, startShowing }: { label: string, content: JSX.Element, svgColor?: string, startShowing?: boolean }) {
    const [showing, showingSet] = useState(startShowing === undefined ? false : startShowing)

    return (
        <div style={{ display: "grid", alignContent: "flex-start" }}>
            {/* label area */}
            <div style={{ display: "flex", gap: ".5rem", alignItems: "center", cursor: "pointer", padding: "1rem" }}
                onClick={() => {
                    showingSet(prev => !prev)
                }}
            >
                <label>{label}</label>

                <div style={{ rotate: showing ? "90deg" : "", transition: "rotate 400ms" }}>
                    <svg style={{ fill: svgColor ?? "" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" /></svg>
                </div>
            </div>

            {/* content */}
            <div style={{ display: !showing ? "none" : "grid", alignContent: "flex-start", overflow: "clip" }}>
                <div style={{ display: "grid", alignContent: "flex-start" }} className={`${showing ? styles.animateIn : ""}`}>
                    {content}
                </div>
            </div>
        </div>
    )
}
