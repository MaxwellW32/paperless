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
    speed: number,
    rotation: { x: { value: number, incrementer: number }, y: { value: number, incrementer: number }, z: { value: number, incrementer: number } },
    width: number,
    el: HTMLParagraphElement
}

export default function ConnectBackground({ text }: { text: string }) {
    const backgroundContRef = useRef<HTMLDivElement | null>(null)
    const lettersOnBackground = useRef<{ [key: string]: letterObjType }>({})

    const amtOfRequests = useRef(0)
    const currentlyHandling = useRef(1)

    const callsPerSecond = useRef(0)
    const rateLimitDebounce = useRef<NodeJS.Timeout>()
    const rateResetDebounce = useRef<NodeJS.Timeout>()

    //everytime text changes animate the letter
    useEffect(() => {
        if (text === "") return

        rateLimit(() => {
            animateLetter(text[text.length - 1])
        })
    }, [text])

    function animateLetter(letter: string) {
        if (backgroundContRef.current === null) return

        const center = { x: backgroundContRef.current.clientWidth / 2, y: backgroundContRef.current.clientHeight / 2 }
        const direction = { x: Math.random() * 5, y: Math.random() * 5 }

        const flipDirectionX = Math.random() > 0.5
        const flipDirectionY = Math.random() > 0.5
        if (flipDirectionX) {
            direction.x *= -1
        }
        if (flipDirectionY) {
            direction.y *= -1
        }

        const rotationIncrementer = { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10), z: Math.floor(Math.random() * 10) }
        //limit z rotation
        if (Math.random() < 0.8) {
            rotationIncrementer.z = 0
        }

        const newLetterObj: letterObjType = {
            id: uuidV4(),
            position: center,
            direction: direction,
            speed: 100,
            rotation: { x: { value: 0, incrementer: rotationIncrementer.x }, y: { value: 0, incrementer: rotationIncrementer.y }, z: { value: 0, incrementer: rotationIncrementer.z } },
            width: Math.floor(Math.random() * 250) + 50,
            el: document.createElement("p")
        }

        newLetterObj.el.innerText = letter

        //add styles
        newLetterObj.el.classList.add(styles.displayText)
        newLetterObj.el.style.fontSize = `${newLetterObj.width}px`
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
            console.log(`$loop`);
            if (backgroundContRef.current === null) return

            //write changes
            //stop and clear if off screen

            //increase the position by the direction
            seenLetterObj.position.x += seenLetterObj.direction.x
            seenLetterObj.position.y += seenLetterObj.direction.y

            //increase the rotation
            seenLetterObj.rotation.x.value += seenLetterObj.rotation.x.incrementer
            seenLetterObj.rotation.y.value += seenLetterObj.rotation.y.incrementer
            seenLetterObj.rotation.z.value += seenLetterObj.rotation.z.incrementer

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

                console.log(`$out of bounds`);
            }
        }, seenLetterObj.speed);
    }

    function applyLetterTransforms(seenLetterObj: letterObjType) {
        seenLetterObj.el.style.translate = `${(seenLetterObj.position.x) - (seenLetterObj.width / 2)}px ${(seenLetterObj.position.y) - (seenLetterObj.width / 2)}px`

        seenLetterObj.el.style.transform = `rotateX(${seenLetterObj.rotation.x.value}deg) rotateY(${seenLetterObj.rotation.y.value}deg) rotateZ(${seenLetterObj.rotation.z.value}deg)`
    }

    function rateLimit(funcToRun: () => void, timeToWait = 2000) {
        //handle how often rate is called
        callsPerSecond.current += 1

        if (rateLimitDebounce.current) clearTimeout(rateLimitDebounce.current)
        rateLimitDebounce.current = setTimeout(() => {
            callsPerSecond.current = 0
        }, 1000);

        const IdOfRequest = amtOfRequests.current += 1

        function runCheck() {
            if (IdOfRequest === currentlyHandling.current) {
                funcToRun()

                //after some time can accept the next request
                setTimeout(() => {
                    currentlyHandling.current = IdOfRequest
                }, timeToWait);

                if (IdOfRequest === amtOfRequests.current) {
                    if (rateResetDebounce.current) clearTimeout(rateResetDebounce.current)
                    rateResetDebounce.current = setTimeout(() => {
                        //reset since finished
                        amtOfRequests.current = 0
                        currentlyHandling.current = 0
                    }, 1000);
                }

            } else {
                //check back after some time
                setTimeout(() => {
                    runCheck()
                }, timeToWait);
            }
        }
        runCheck()
    }

    return (
        <div ref={backgroundContRef} className={styles.backgroundCont}>
        </div>
    )
}
