"use client"
import React from 'react'

export default function Markup() {
    // let currentScreen = 1

    return (
        <div style={{ display: "grid", alignContent: "flex-start", justifyItems: "flex-start" }}>
            <h1>h1: Title</h1>
            <h2>h2: Title</h2>
            <h3>h3: Title</h3>
            <h4>h4: Title</h4>
            <h5>h5: Title</h5>
            <p>p: Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quia ipsum voluptate accusamus</p>
            <button className='button1'>click me</button>
            <button className='button2'>click me</button>
            <button className='button3'>click me</button>
            <label>label: my title</label>
            <p className='tag'>tag: title</p>

            {/* <div>
                {currentScreen === 1 && (
                    <>

                    </>
                )}

                {currentScreen === 2 && (
                    <>

                    </>
                )}

                {currentScreen === 3 && (
                    <>

                    </>
                )}

                {currentScreen === 4 && (
                    <>

                    </>
                )}
            </div> */}
        </div>
    )
}
