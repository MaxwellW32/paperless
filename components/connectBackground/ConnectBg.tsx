import React, { useEffect, useRef } from 'react'
import styles from "./styles.module.css"
import { v4 as uuidV4 } from 'uuid'

//want to see the email im typing displayed in dots
//make a matrix of dots
//on key press fetch the correct dot trace sequence 
//draw the character 
//move the dots randomly 
//animate 
// 
// 
// 
// 
// 

type letterObjType = {
    id: string,
    position: { x: number, y: number },
    direction: { x: number, y: number },
    rotation: { x: { value: number, incrementer: number }, y: { value: number, incrementer: number }, z: { value: number, incrementer: number } },
    width: number,
    el: HTMLParagraphElement
}

export default function ConnectBackground({ text }: { text: string }) {
    const backgroundContRef = useRef<HTMLDivElement | null>(null)
    const lettersOnBackground = useRef<{ [key: string]: letterObjType }>({})

    const amtOfRequests = useRef(-1)
    const functionTimes = useRef<number[]>([])
    const requestDebounce = useRef<NodeJS.Timeout | undefined>()

    //everytime text changes animate the letter
    useEffect(() => {
        if (text === "") return

        //limit amount on screen
        if (amtOfRequests.current > 200) return

        sequentialOrder(() => {
            animateLetter(text[text.length - 1])
        })
    }, [text])

    function animateLetter(letter: string) {
        if (backgroundContRef.current === null) return

        const width = Math.floor(Math.random() * 250) + 50

        let offsetX = Math.random() * (width / 2)
        let offsetY = Math.random() * (width / 2)
        offsetX = Math.random() > 0.5 ? offsetX : offsetX * -1
        offsetY = Math.random() > 0.5 ? offsetY : offsetY * -1

        const center = { x: (backgroundContRef.current.clientWidth / 2) + offsetX, y: (backgroundContRef.current.clientHeight / 2) + offsetY }
        const direction = { x: Math.random() * 3, y: Math.random() * 3 }

        //flip direction
        if (Math.random() > 0.5) direction.x *= -1
        if (Math.random() > 0.5) direction.y *= -1


        const rotationIncrementer = { x: Math.floor(Math.random() * 3), y: Math.floor(Math.random() * 3), z: 0 }
        //limit z rotation
        if (Math.random() > 0.8) rotationIncrementer.z = Math.floor(Math.random() * 3)

        const newLetterObj: letterObjType = {
            id: uuidV4(),
            position: center,
            direction: direction,
            rotation: { x: { value: 0, incrementer: rotationIncrementer.x }, y: { value: 0, incrementer: rotationIncrementer.y }, z: { value: 0, incrementer: rotationIncrementer.z } },
            width: width,
            el: document.createElement("p")
        }

        newLetterObj.el.innerText = letter

        //add styles
        newLetterObj.el.classList.add(styles.displayText)
        newLetterObj.el.style.fontSize = `${newLetterObj.width}px`
        Math.random() > 0.5 ? newLetterObj.el.style.textTransform = "uppercase" : null

        //initial position
        applyLetterTransforms(newLetterObj)

        //add to list
        lettersOnBackground.current[newLetterObj.id] = newLetterObj
        backgroundContRef.current.appendChild(newLetterObj.el)

        //move loop
        moveText(newLetterObj)
    }

    function moveText(seenLetterObj: letterObjType) {
        const moveInterval = setInterval(() => {
            if (backgroundContRef.current === null) return
            //increase the position by the direction
            seenLetterObj.position.x += seenLetterObj.direction.x
            seenLetterObj.position.y += seenLetterObj.direction.y

            //increase the rotation
            seenLetterObj.rotation.x.value = (seenLetterObj.rotation.x.value + seenLetterObj.rotation.x.incrementer) % 360
            seenLetterObj.rotation.y.value = (seenLetterObj.rotation.y.value + seenLetterObj.rotation.y.incrementer) % 360
            seenLetterObj.rotation.z.value = (seenLetterObj.rotation.z.value + seenLetterObj.rotation.z.incrementer) % 360

            //set changes to dom
            applyLetterTransforms(seenLetterObj)

            //stop if not in bounds
            const offset = seenLetterObj.width + 20
            const outOfBoundsX = (seenLetterObj.position.x < 0 - offset) || (seenLetterObj.position.x > backgroundContRef.current.offsetWidth + offset)
            const outOfBoundsY = (seenLetterObj.position.y < 0 - offset) || (seenLetterObj.position.y > backgroundContRef.current.offsetHeight + offset)

            //out of bounds
            if (outOfBoundsX || outOfBoundsY) {
                clearInterval(moveInterval)

                //remove from dom
                seenLetterObj.el.remove()

                //remove from lettersOnBackground
                delete lettersOnBackground.current[seenLetterObj.id]

                console.log(`$cleaned`);
            }
        }, 10);
    }

    function applyLetterTransforms(seenLetterObj: letterObjType) {
        seenLetterObj.el.style.translate = `${(seenLetterObj.position.x) - (seenLetterObj.width / 2)}px ${(seenLetterObj.position.y) - (seenLetterObj.width / 2)}px`

        seenLetterObj.el.style.transform = `rotateX(${seenLetterObj.rotation.x.value}deg) rotateY(${seenLetterObj.rotation.y.value}deg) rotateZ(${seenLetterObj.rotation.z.value}deg)`
    }

    async function sequentialOrder(funcToRun: () => void) {
        //reset functionTimes after long delay
        if (requestDebounce.current) clearTimeout(requestDebounce.current)
        requestDebounce.current = setTimeout(() => {
            functionTimes.current = []
            amtOfRequests.current = -1
        }, 10_000);

        const IndexOfRequest = amtOfRequests.current += 1
        const largeTime = Math.random() > 0.95 ? 1.5 : 1
        const waitTime = IndexOfRequest === 0 ? 0 : (Math.floor(Math.random() * 1500) * largeTime)
        const prevFuncWaitTime: number | undefined = functionTimes.current[IndexOfRequest - 1]
        const combinedWaitTime = (prevFuncWaitTime === undefined ? 0 : prevFuncWaitTime) + waitTime

        //add onto wait times
        functionTimes.current[IndexOfRequest] = waitTime

        //wait
        await new Promise(resolve => setTimeout(() => resolve(true), combinedWaitTime))    //+ wait time of previous function

        //run
        funcToRun()
    }

    return (
        <div ref={backgroundContRef} className={styles.backgroundCont}>
        </div>
    )
}
