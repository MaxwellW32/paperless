"use client"
import { deletePage, getSpecificPage, updateThePage } from '@/serverFunctions/handlePages'
import { deleteUsedComponent, getSpecificUsedComponent, updateTheUsedComponent } from '@/serverFunctions/handleUsedComponents'
import { getSpecificWebsite, refreshWebsitePath, updateTheWebsite } from '@/serverFunctions/handleWebsites'
import { handleManagePageOptions, handleManageUpdateUsedComponentsOptions, page, sizeOptionType, templateDataType, updatePageSchema, updateUsedComponentSchema, updateWebsite, updateWebsiteSchema, usedComponent, usedComponentLocationType, viewerTemplateType, website, webSocketMessageJoinSchema, webSocketMessageJoinType, webSocketMessagePingType, webSocketStandardMessageSchema, webSocketStandardMessageType, } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import globalDynamicTemplates from '@/utility/globalTemplates'
import { addScopeToCSS, formatCSS, getChildrenUsedComponents, getDescendedUsedComponents, makeValidVariableName, sanitizeUsedComponentData, sortUsedComponentsByOrder, } from '@/utility/utility'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import AddEditPage from '../pages/AddEditPage'
import ShowMore from '../showMore/ShowMore'
import TemplateDataSwitch from '../templates/templateData/TemplateDataSwitch'
import TemplateSelector from '../templates/TemplateSelector'
import UsedComponentLocationSelector from '../usedComponents/usedComponentLocationSelector/UsedComponentLocationSelector'
import UsedComponentOrderSelector from '../usedComponents/usedComponentOrderSelector/UsedComponentOrderSelector'
import LocationSelector from './LocationSelector'
import styles from "./style.module.css"
import { Session } from 'next-auth'
import DownloadOptions from '../downloadOptions/DownloadOptions'
import RecursiveForm from '../recursiveForm/RecursiveForm'
import useEditingContent from './UseEditingContent'

export default function ViewWebsite({ websiteFromServer, seenSession }: { websiteFromServer: website, seenSession: Session }) {
    const { editingContent, setEditing } = useEditingContent()

    const [showingSideBar, showingSideBarSet] = useState(true)
    const [dimSideBar, dimSideBarSet] = useState<boolean>(false)
    const [viewingDownloadOptions, viewingDownloadOptionsSet] = useState(false)

    const [sizeOptions, sizeOptionsSet] = useState<sizeOptionType[]>([
        {
            name: "mobile",
            width: 375,
            height: 667,
            active: false,
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M80 0C44.7 0 16 28.7 16 64l0 384c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-384c0-35.3-28.7-64-64-64L80 0zM192 400a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
        },
        {
            name: "tablet",
            width: 768,
            height: 1024,
            active: false,
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-384c0-35.3-28.7-64-64-64L64 0zM176 432l96 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z" /></svg>
        },
        {
            name: "desktop",
            width: 1920,
            height: 1080,
            active: true,
            icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 224L64 288 64 64l448 0z" /></svg>
        },
    ])
    const activeSizeOption = useMemo(() => {
        return sizeOptions.find(eachSizeOption => eachSizeOption.active)
    }, [sizeOptions])

    const [canvasScale, canvasScaleSet] = useState(1)
    const [fit, fitSet] = useState(true)

    const spacerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLDivElement | null>(null)
    const canvasContRef = useRef<HTMLDivElement | null>(null)

    const [websiteObj, websiteObjSet] = useState<website>(websiteFromServer)

    const [activePageId, activePageIdSet] = useState<page["id"] | undefined>(websiteObj.pages !== undefined && websiteObj.pages.length > 0 ? websiteObj.pages[0].id : undefined)
    const activePage = useMemo<page | undefined>(() => {
        if (websiteObj.pages === undefined || activePageId === undefined) return undefined

        const foundPage = websiteObj.pages.find(eachPageFind => eachPageFind.id === activePageId)
        if (foundPage === undefined) return undefined

        return foundPage
    }, [websiteObj.pages, activePageId])

    const [activeLocation, activeLocationSet] = useState<usedComponentLocationType>(activePage === undefined ? { type: "header" } : { type: "page", pageId: activePage.id })

    const [addingPage, addingPageSet] = useState(false)
    const [usedComponentsBuilt, usedComponentsBuiltSet] = useState(false)

    const tempActiveUsedComponentId = useRef<usedComponent["id"]>("")
    const [activeUsedComponentId, activeUsedComponentIdSet] = useState<usedComponent["id"]>("")
    const [selectionOption, selectionOptionSet] = useState<"website" | "page" | "component" | undefined>()

    const activeUsedComponent = useMemo<usedComponent | undefined>(() => {
        if (websiteObj.usedComponents === undefined) return undefined

        const foundUsedComponent = websiteObj.usedComponents.find(eachUsedComponentFind => eachUsedComponentFind.id === activeUsedComponentId)
        return foundUsedComponent

    }, [websiteObj.usedComponents, activeUsedComponentId])

    const renderedUsedComponentsObj = useRef<{
        [key: string]: React.ComponentType<{
            data: templateDataType;
        }>
    }>({})

    const updateWebsiteDebounce = useRef<NodeJS.Timeout>()
    const updatePageDebounce = useRef<{ [key: string]: NodeJS.Timeout }>({})
    const updateUsedComponentDebounce = useRef<{ [key: string]: NodeJS.Timeout }>({})

    const [saveState, saveStateSet] = useState<"saving" | "saved">("saved")
    const [viewerTemplate, viewerTemplateSet] = useState<viewerTemplateType | null>(null)
    const wsRef = useRef<WebSocket | null>(null);
    const [, webSocketsConnectedSet] = useState(false)

    //get usedComponents on the active page
    const pageUsedComponents = useMemo(() => {
        if (websiteObj.usedComponents === undefined || activePage === undefined) return []

        const usedComponentsInPage = websiteObj.usedComponents.filter(eachUsedComponentFilter => {
            return eachUsedComponentFilter.location.type === "page" && eachUsedComponentFilter.location.pageId === activePage.id
        })

        const sortedUsedComponents = sortUsedComponentsByOrder(usedComponentsInPage)
        return sortedUsedComponents

    }, [websiteObj.usedComponents, activePage])

    const headerUsedComponents = useMemo(() => {
        if (websiteObj.usedComponents === undefined) return []

        const usedComponentsInHeader = websiteObj.usedComponents.filter(eachUsedComponentFilter => {
            return eachUsedComponentFilter.location.type === "header"
        })
        const sortedUsedComponents = sortUsedComponentsByOrder(usedComponentsInHeader)
        return sortedUsedComponents

    }, [websiteObj.usedComponents])

    const footerUsedComponents = useMemo(() => {
        if (websiteObj.usedComponents === undefined) return []

        const usedComponentsInFooter = websiteObj.usedComponents.filter(eachUsedComponentFilter => {
            return eachUsedComponentFilter.location.type === "footer"
        })
        const sortedUsedComponents = sortUsedComponentsByOrder(usedComponentsInFooter)
        return sortedUsedComponents

    }, [websiteObj.usedComponents])

    // respond to changes from server - build usedComponents seen there
    useEffect(() => {
        const start = async () => {
            try {
                //replace original
                if (websiteFromServer.usedComponents !== undefined) {
                    websiteFromServer.usedComponents = await renderUsedComponentsInUse(websiteFromServer.usedComponents, activePage !== undefined ? activePage.id : undefined)

                    //run check for any broken used components - remove them
                    ////used component is broken if pageId doesnt exist in pages and if parentId not in other used components
                    const brokenUsedComponents = websiteFromServer.usedComponents.filter(eachUsedComponent => {
                        const seenLocation = eachUsedComponent.location

                        //make sure the page it belongs to exits
                        if (seenLocation.type === "page") {
                            if (websiteFromServer.pages === undefined) return false

                            return websiteFromServer.pages.find(eachPage => eachPage.id === seenLocation.pageId) === undefined

                            //make sure its parent used component exists
                        } else if (seenLocation.type === "child") {
                            if (websiteFromServer.usedComponents === undefined) return false

                            return websiteFromServer.usedComponents.find(eachUsedComponentFind => eachUsedComponentFind.id === seenLocation.parentId) === undefined
                        }

                        return false
                    })

                    if (brokenUsedComponents.length > 0) {
                        //delete on server
                        Promise.all(brokenUsedComponents.map(async eachBrokenUsedComponent => {
                            return await deleteUsedComponent(eachBrokenUsedComponent.websiteId, eachBrokenUsedComponent.id)

                        })).then(() => {
                            console.log(`$deleted broken usedComponents`)

                            refreshWebsitePath({ id: websiteFromServer.id })
                        })
                    }
                }

                //update obj locally with changes
                websiteObjSet(websiteFromServer)

            } catch (error) {
                consoleAndToastError(error)
            }
        }

        start()
    }, [websiteFromServer])

    //calculate fit on device size change
    useEffect(() => {
        if (canvasContRef.current === null || activeSizeOption === undefined) return

        const widthDiff = canvasContRef.current.clientWidth / activeSizeOption.width
        const heightDiff = canvasContRef.current.clientHeight / activeSizeOption.height

        const newScale = widthDiff < heightDiff ? widthDiff : heightDiff

        canvasScaleSet(newScale)

    }, [activeSizeOption, canvasContRef])

    //center canvasView
    useEffect(() => {
        centerCanvas()
    }, [activeSizeOption, fit])

    //add keydown listener for interaction clicks
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [tempActiveUsedComponentId])

    //load up fonts dynamically
    useEffect(() => {
        const linkElements = websiteObj.fonts.map(eachFont => {
            const link = document.createElement('link')

            //replace underscores with + for google fonts api
            const fontImportNameForApi = eachFont.importName.replace(/ /g, '+')

            link.rel = 'stylesheet'
            link.href = `https://fonts.googleapis.com/css?family=${fontImportNameForApi}&subset=${eachFont.subsets.join(", ")}`

            document.head.appendChild(link);
            const camelCaseName = makeValidVariableName(eachFont.importName)

            link.onload = () => {
                // Set the font family as a CSS variable
                document.documentElement.style.setProperty(`--font-${camelCaseName}`, `${eachFont.importName}`);
                // href="https://fonts.googleapis.com/css?family=Tangerine">
            };

            return link
        })

        return () => {
            linkElements.map(eachLinkEl => {
                document.head.removeChild(eachLinkEl);
            })
        };
    }, [websiteObj.fonts])

    //handle websockets
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            webSocketsConnectedSet(true);
            console.log(`$ws connected`);

            const newJoinMessage: webSocketMessageJoinType = {
                type: "join",
                websiteId: websiteObj.id
            }

            webSocketMessageJoinSchema.parse(newJoinMessage)

            //send request to join a website id room
            ws.send(JSON.stringify(newJoinMessage));
        };

        ws.onclose = () => {
            webSocketsConnectedSet(false);
        };

        ws.onmessage = (event) => {
            const seenMessage = webSocketStandardMessageSchema.parse(JSON.parse(event.data.toString()))

            if (seenMessage.type === "standard") {
                const seenMessageObj = seenMessage.data.updated

                if (seenMessageObj.type === "website") {
                    const searchWebsite = async () => {
                        const latestWebsite = await getSpecificWebsite({ option: "id", data: { id: websiteObj.id } }, true)
                        if (latestWebsite === undefined) return

                        //set latest
                        websiteObjSet((prevWebsiteObj) => {
                            const newWebsiteObj = { ...prevWebsiteObj, ...latestWebsite }

                            return newWebsiteObj
                        })
                    }
                    searchWebsite()

                } else if (seenMessageObj.type === "page") {
                    //get latest page
                    const searchPage = async () => {
                        if (seenMessageObj.refresh) {
                            const checkIfEditing = async () => {
                                //reload all 
                                if (!editingContent.current.pages) {
                                    refreshWebsitePath({ id: websiteObj.id })

                                } else {
                                    console.log(`$update happened while you were editing will wait until finished to update pages`);

                                    // editing check back later
                                    setTimeout(() => {
                                        checkIfEditing()
                                    }, 10_000);
                                }
                            }
                            checkIfEditing()

                        } else {
                            //add/update specific page
                            const latestPage = await getSpecificPage(seenMessageObj.pageId)
                            if (latestPage === undefined) return

                            //set latest
                            websiteObjSet((prevWebsiteObj) => {
                                const newWebsiteObj = { ...prevWebsiteObj }
                                if (newWebsiteObj.pages === undefined) return prevWebsiteObj

                                const pageFoundInArray = newWebsiteObj.pages.find(eachPageFind => eachPageFind.id === latestPage.id) !== undefined

                                if (pageFoundInArray) {
                                    //update
                                    newWebsiteObj.pages = newWebsiteObj.pages.map(eachPage => {
                                        if (eachPage.id === latestPage.id) {
                                            return latestPage
                                        }

                                        return eachPage
                                    })

                                } else {
                                    //add
                                    newWebsiteObj.pages = [...newWebsiteObj.pages, latestPage]
                                }

                                return newWebsiteObj
                            })
                        }

                    }
                    searchPage()

                } else if (seenMessageObj.type === "usedComponent") {
                    //get latest usedComponent
                    const searchUsedComponent = async () => {
                        if (seenMessageObj.refresh) {
                            const checkIfEditing = async () => {
                                //reload all 
                                if (!editingContent.current.usedComponents) {
                                    refreshWebsitePath({ id: websiteObj.id })

                                } else {
                                    // editing check back later
                                    console.log(`$update happened while you were editing will wait until finished to update usedComponents`);

                                    setTimeout(() => {
                                        checkIfEditing()
                                    }, 10_000);
                                }
                            }
                            checkIfEditing()

                        } else {
                            //add/update specific usedComponent
                            const latestUsedComponent = await getSpecificUsedComponent(seenMessageObj.usedComponentId)
                            if (latestUsedComponent === undefined) return

                            //ensure can be rendered
                            await buildUsedComponents([latestUsedComponent])

                            //set latest
                            websiteObjSet((prevWebsiteObj) => {
                                const newWebsiteObj = { ...prevWebsiteObj }
                                if (newWebsiteObj.usedComponents === undefined) return prevWebsiteObj

                                const usedComponentFoundInArray = newWebsiteObj.usedComponents.find(eachUsedComponentFind => eachUsedComponentFind.id === latestUsedComponent.id) !== undefined

                                if (usedComponentFoundInArray) {
                                    //update
                                    newWebsiteObj.usedComponents = newWebsiteObj.usedComponents.map(eachUsedComponent => {
                                        if (eachUsedComponent.id === latestUsedComponent.id) {
                                            return latestUsedComponent
                                        }

                                        return eachUsedComponent
                                    })

                                } else {
                                    //add
                                    newWebsiteObj.usedComponents = [...newWebsiteObj.usedComponents, latestUsedComponent]
                                }

                                return newWebsiteObj
                            })
                        }

                    }
                    searchUsedComponent()
                }
            };
        }

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const newPingMessage: webSocketMessagePingType = {
                    type: "ping"
                }

                //keep connection alive
                ws.send(JSON.stringify(newPingMessage));
                console.log(`$sent ping`);
            }
        }, 29000);

        return () => {
            clearInterval(pingInterval);

            if (wsRef.current) {
                // wsRef.current.close();
            }
        };
    }, [])

    function centerCanvas() {
        if (canvasContRef.current === null || spacerRef.current == null || activeSizeOption === undefined || canvasRef.current === null) return

        //center scroll bars
        canvasContRef.current.scrollLeft = (canvasContRef.current.scrollWidth / 2) - (canvasContRef.current.clientWidth / 2)
        canvasContRef.current.scrollTop = 0

        canvasRef.current.style.left = `${spacerRef.current.clientWidth / 2 - (fit ? canvasContRef.current.clientWidth : activeSizeOption.width) / 2}px`
    }

    async function buildUsedComponents(sentUsedComponents: usedComponent[]) {
        usedComponentsBuiltSet(false)

        //ensure all can be rendered
        await Promise.all(
            sentUsedComponents.map(async eachUsedComponent => {
                //if doesnt exist in renderObj then render it
                if (renderedUsedComponentsObj.current[eachUsedComponent.templateId] === undefined) {
                    const seenResponse = await globalDynamicTemplates(eachUsedComponent.templateId)

                    //assign builds to renderObj
                    if (seenResponse !== undefined) {
                        renderedUsedComponentsObj.current[eachUsedComponent.templateId] = seenResponse()

                    } else {
                        //log component id not found
                        console.log(`$usedComponent template id not found`, eachUsedComponent.templateId);
                    }
                }

                return eachUsedComponent
            }))

        usedComponentsBuiltSet(true)
    }

    async function handleWebsiteUpdate(newWebsite: website) {
        //set is editing
        setEditing("website")

        try {
            //when something updates website handle it on user interaction
            //update locally
            websiteObjSet(newWebsite)

            //update on server after delay
            if (updateWebsiteDebounce.current) clearTimeout(updateWebsiteDebounce.current)

            //make new website schema
            updateWebsiteDebounce.current = setTimeout(async () => {
                //ensure only certain fields can be updated
                const validatedNewWebsite = updateWebsiteSchema.parse(newWebsite)

                saveStateSet("saving")
                await updateTheWebsite(newWebsite.id, validatedNewWebsite)

                console.log(`$saved website to db`);
                saveStateSet("saved")

                //update websocket
                sendWebsocketUpdate({
                    type: "website"
                })
            }, 3000);

        } catch (error) {
            consoleAndToastError(error)
        }
    }
    async function handleManagePage(options: handleManagePageOptions) {
        //set is editing
        setEditing("pages")

        try {
            if (options.option === "create") {
                //add locally
                websiteObjSet(prevWebsite => {
                    const newWebsite = { ...prevWebsite }

                    //ensure pages seen
                    if (newWebsite.pages === undefined) {
                        return prevWebsite
                    }

                    //set new page
                    newWebsite.pages = [...newWebsite.pages, options.seenAddedPage]

                    if (newWebsite.pages.length === 1) {
                        activePageIdSet(options.seenAddedPage.id)
                    }

                    return newWebsite
                })

                //update websocket
                sendWebsocketUpdate({
                    type: "page",
                    pageId: options.seenAddedPage.id,
                    refresh: false
                })

            } else if (options.option === "update") {
                //update locally
                websiteObjSet(prevWebsite => {
                    const newWebsite = { ...prevWebsite }

                    //ensure pages seen
                    if (newWebsite.pages === undefined) return prevWebsite

                    //update the page
                    newWebsite.pages = newWebsite.pages.map(eachPage => {
                        if (eachPage.id === options.updatedPageId) {
                            return { ...eachPage, ...options.seenUpdatedPage }
                        }

                        return eachPage
                    })

                    return newWebsite
                })

                //update on server after delay
                if (updatePageDebounce.current[options.updatedPageId]) clearTimeout(updatePageDebounce.current[options.updatedPageId])

                //make new website schema
                updatePageDebounce.current[options.updatedPageId] = setTimeout(async () => {
                    //ensure only certain fields can be updated
                    const validatedUpdatedPage = updatePageSchema.parse(options.seenUpdatedPage)

                    saveStateSet("saving")
                    await updateThePage(options.updatedPageId, websiteObj.id, validatedUpdatedPage)

                    console.log(`$saved page to db`);
                    saveStateSet("saved")

                    //update websocket
                    sendWebsocketUpdate({
                        type: "page",
                        pageId: options.updatedPageId,
                        refresh: false
                    })
                }, 3000);
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }
    async function handleManageUsedComponents(options: handleManageUpdateUsedComponentsOptions) {
        try {
            //set is editing
            setEditing("usedComponents")

            if (options.option === "create") {
                //ensure can be rendered
                await buildUsedComponents([options.seenAddedUsedComponent])

                //add locally
                websiteObjSet(prevWebsite => {
                    const newWebsite = { ...prevWebsite }
                    if (newWebsite.usedComponents === undefined) return prevWebsite

                    newWebsite.usedComponents = [...newWebsite.usedComponents, options.seenAddedUsedComponent]

                    return newWebsite
                })

                //update websocket
                sendWebsocketUpdate({
                    type: "usedComponent",
                    usedComponentId: options.seenAddedUsedComponent.id,
                    refresh: false
                })

            } else if (options.option === "update") {
                //add component info onto object
                if (options.rebuild) {
                    //ensure can be rendered
                    await buildUsedComponents([options.seenUpdatedUsedComponent])

                    options.seenUpdatedUsedComponent = options.seenUpdatedUsedComponent
                }

                //update locally
                websiteObjSet(prevWebsite => {
                    const newWebsite = { ...prevWebsite }
                    if (newWebsite.usedComponents === undefined) return prevWebsite

                    newWebsite.usedComponents = newWebsite.usedComponents.map(eachUsedComponent => {
                        if (eachUsedComponent.id === options.seenUpdatedUsedComponent.id) {
                            return options.seenUpdatedUsedComponent
                        }

                        return eachUsedComponent
                    })

                    return newWebsite
                })

                //update on server after delay
                if (updateUsedComponentDebounce.current[options.seenUpdatedUsedComponent.id]) clearTimeout(updateUsedComponentDebounce.current[options.seenUpdatedUsedComponent.id])

                //make new website schema
                updateUsedComponentDebounce.current[options.seenUpdatedUsedComponent.id] = setTimeout(async () => {
                    //ensure only certain fields can be updated
                    const sanitizedUpdateComponent = sanitizeUsedComponentData(options.seenUpdatedUsedComponent)

                    const validatedUpdatedUsedComponent = updateUsedComponentSchema.parse(sanitizedUpdateComponent)

                    saveStateSet("saving")
                    await updateTheUsedComponent(options.seenUpdatedUsedComponent.websiteId, options.seenUpdatedUsedComponent.id, validatedUpdatedUsedComponent)

                    console.log(`$saved usedComponent to db`);
                    saveStateSet("saved")

                    //update websocket
                    sendWebsocketUpdate({
                        type: "usedComponent",
                        usedComponentId: options.seenUpdatedUsedComponent.id,
                        refresh: false
                    })
                }, 3000);
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function handlePropsChange(newPropsObj: templateDataType, sentUsedComponent: usedComponent) {
        //update the data
        sentUsedComponent.data = newPropsObj

        handleManageUsedComponents({ option: "update", seenUpdatedUsedComponent: sentUsedComponent })
    }

    function handleKeyDown(e: KeyboardEvent) {
        const activationKeys = ["alt"]

        const seenKey = e.key.toLowerCase()

        if (activationKeys.includes(seenKey)) {
            activeUsedComponentIdSet(tempActiveUsedComponentId.current)
        }
    }

    function handleSelectUsedComponent() {
        if (tempActiveUsedComponentId.current === "") return

        activeUsedComponentIdSet(tempActiveUsedComponentId.current)

        selectionOptionSet("component")
    }

    async function renderUsedComponentsInUse(seenUsedComponents: usedComponent[], seenActivePageId?: page["id"]) {
        //get the header, footer and usedComponents on this page
        const baseUsedComponentsInUse = seenUsedComponents.filter(eachFilterUsedComponent => {
            return eachFilterUsedComponent.location.type === "header" || eachFilterUsedComponent.location.type === "footer" || (seenActivePageId !== undefined && eachFilterUsedComponent.location.type === "page" && eachFilterUsedComponent.location.pageId === seenActivePageId)
        })

        //then get all of the base components children recursively
        const baseUsedComponentsInUseIds = baseUsedComponentsInUse.map(eachBaseUsedComponentInUseId => eachBaseUsedComponentInUseId.id)
        const baseUsedComponentsDecendants: usedComponent[] = getDescendedUsedComponents(baseUsedComponentsInUseIds, seenUsedComponents)

        const totalUsedComponentsToRender = [...baseUsedComponentsInUse, ...baseUsedComponentsDecendants]

        //ensure can be rendered
        await buildUsedComponents(totalUsedComponentsToRender)

        //add back onto the original list
        const updatedUsedComponents = seenUsedComponents.map(eachUsedComponent => {
            const seenUpdatedUsedComponent = totalUsedComponentsToRender.find(eachBuiltComponentFind => eachBuiltComponentFind.id === eachUsedComponent.id)
            if (seenUpdatedUsedComponent !== undefined) return seenUpdatedUsedComponent

            //return original usedComponent
            return eachUsedComponent
        })

        //return the exact list with some usedComponents built/added to render obj
        return updatedUsedComponents
    }

    function sendWebsocketUpdate(updateOption: webSocketStandardMessageType["data"]["updated"]) {
        const newWebSocketsMessage: webSocketStandardMessageType = {
            type: "standard",
            data: {
                websiteId: websiteObj.id,
                updated: updateOption
            }
        }

        webSocketStandardMessageSchema.parse(newWebSocketsMessage)

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(newWebSocketsMessage));
        }
    }

    return (
        <main className={styles.main}>
            <div className={styles.topSettingsCont}>
                <div>
                    {saveState === "saving" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>
                    )}
                </div>

                <div className={styles.mainSettingsContMiddle}>
                    {sizeOptions.map(eachSizeOption => {
                        return (
                            <button key={eachSizeOption.name}
                                onClick={() => {
                                    sizeOptionsSet(prevSizeOptions => {
                                        const newSizeOptions = prevSizeOptions.map(eachSmallSizeOption => {
                                            if (eachSmallSizeOption.name === eachSizeOption.name) {
                                                eachSmallSizeOption.active = true
                                            } else {
                                                eachSmallSizeOption.active = false
                                            }

                                            return eachSmallSizeOption
                                        })

                                        return newSizeOptions
                                    })

                                    fitSet(false)
                                }}
                            >
                                {eachSizeOption.icon}
                            </button>
                        )
                    })}

                    <button
                        onClick={() => {
                            fitSet(prev => !prev)
                        }}
                    >
                        {fit ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M160 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 320c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M32 32C14.3 32 0 46.3 0 64l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96z" /></svg>
                        )}
                    </button>
                </div>

                <div></div>
            </div>

            <div className={styles.mainContent}>
                <div ref={canvasContRef} className={styles.canvasCont}>
                    {activeSizeOption !== undefined && (
                        <div ref={canvasRef} className={styles.canvas} style={{ width: fit ? canvasContRef.current?.clientWidth : activeSizeOption.width, height: fit ? canvasContRef.current?.clientHeight : activeSizeOption.height, scale: fit ? 1 : canvasScale }}
                            onClick={handleSelectUsedComponent}
                        >
                            <style>{addScopeToCSS(websiteObj.globalCss, websiteObj.id)}</style>

                            {usedComponentsBuilt && websiteObj.usedComponents !== undefined && (
                                <>
                                    <RenderComponentTree seenUsedComponents={headerUsedComponents} originalUsedComponentsList={websiteObj.usedComponents} websiteObj={websiteObj} renderedUsedComponentsObj={renderedUsedComponentsObj} tempActiveUsedComponentId={tempActiveUsedComponentId} viewerTemplate={viewerTemplate} />

                                    <RenderComponentTree seenUsedComponents={pageUsedComponents} originalUsedComponentsList={websiteObj.usedComponents} websiteObj={websiteObj} renderedUsedComponentsObj={renderedUsedComponentsObj} tempActiveUsedComponentId={tempActiveUsedComponentId} viewerTemplate={viewerTemplate} />

                                    <RenderComponentTree seenUsedComponents={footerUsedComponents} originalUsedComponentsList={websiteObj.usedComponents} websiteObj={websiteObj} renderedUsedComponentsObj={renderedUsedComponentsObj} tempActiveUsedComponentId={tempActiveUsedComponentId} viewerTemplate={viewerTemplate} />
                                </>
                            )}
                        </div>
                    )}

                    <div ref={spacerRef} className={styles.spacer}></div>
                </div>

                <div className={styles.sideBarHolder} style={{ width: showingSideBar ? "min(500px, 100%)" : "" }}>
                    <div className={styles.sideBar} style={{ display: showingSideBar && !dimSideBar ? "" : "none" }}>
                        <div className={styles.topSideBar}>
                            <select value={activePageId}
                                onChange={async (event: React.ChangeEvent<HTMLSelectElement>) => {
                                    if (websiteObj.usedComponents === undefined) return

                                    const eachPageId = event.target.value


                                    //whenever page id changes hold off on showing results
                                    activePageIdSet(eachPageId)

                                    //render components for new page
                                    const seenUsedComponents = await renderUsedComponentsInUse(websiteObj.usedComponents, eachPageId)

                                    //add onto website obj
                                    websiteObjSet(prevWebsiteObj => {
                                        const newWebsiteObj = { ...prevWebsiteObj }

                                        newWebsiteObj.usedComponents = seenUsedComponents

                                        return newWebsiteObj
                                    })
                                }}
                            >
                                {websiteObj.pages !== undefined && websiteObj.pages.map(eachPage => {

                                    return (
                                        <option key={eachPage.id} value={eachPage.id}

                                        >{eachPage.link === "/" ? "home" : eachPage.link}</option>
                                    )
                                })}
                            </select>

                            <LocationSelector location={activeLocation} activeLocationSet={activeLocationSet} activePage={activePage} activeUsedComponent={activeUsedComponent} />
                        </div>

                        <div className={styles.selectionOptionsCont}>
                            {["website", "page", "component"].map(eachOption => {
                                return (
                                    <button key={eachOption} style={{ backgroundColor: eachOption === selectionOption ? "rgb(var(--color1))" : "", justifySelf: "flex-start" }} className='tertiaryButton'
                                        onClick={() => {
                                            selectionOptionSet(eachOption as "page" | "website" | "component")
                                        }}
                                    >{eachOption}</button>
                                )
                            })}

                            <button style={{ marginLeft: "auto", "--translate": "-100% 0" } as React.CSSProperties} className='toolTip' data-tooltip={"download website"}
                                onClick={() => { viewingDownloadOptionsSet(true) }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" /></svg>
                            </button>
                        </div>

                        <div className={styles.selectionContent}>
                            <div style={{ display: selectionOption === "website" ? "grid" : "none", paddingInline: "1rem" }}>
                                <ShowMore
                                    label='Edit global styles'
                                    content={
                                        <textarea rows={10} value={websiteObj.globalCss} className={styles.styleEditor}
                                            onChange={(e) => {
                                                const newWebsite = { ...websiteObj }
                                                newWebsite.globalCss = e.target.value

                                                handleWebsiteUpdate(newWebsite)
                                            }}
                                            onBlur={() => {
                                                const newWebsite = { ...websiteObj }
                                                newWebsite.globalCss = formatCSS(newWebsite.globalCss)

                                                handleWebsiteUpdate(newWebsite)
                                            }}
                                        />
                                    }
                                />

                                <RecursiveForm
                                    seenForm={updateWebsiteSchema.omit({ globalCss: true }).parse(websiteObj)}
                                    seenMoreFormInfo={{
                                        "description": {
                                            element: {
                                                type: "textarea"
                                            }
                                        },
                                        "fonts/0/weights": {
                                            returnToNull: true,
                                        },
                                        "fonts/0/importName": {
                                            placeholder: "copy same name from google fonts - case sensitive",
                                        },
                                    }}
                                    seenArrayStarters={{
                                        "fonts": {
                                            importName: "",
                                            subsets: [],
                                            weights: [],
                                        },
                                        "fonts/0/subsets": "",
                                        "authorisedUsers": {
                                            userId: "",
                                            accessLevel: "view"
                                        },
                                    }}
                                    seenNullishStarters={{
                                        "fonts/0/weights": [],
                                    }}
                                    seenSchema={updateWebsiteSchema.omit({ globalCss: true })}
                                    updater={(seenForm) => {
                                        const newFullWebsite: website = { ...websiteObj, ...(seenForm as updateWebsite) }
                                        handleWebsiteUpdate(newFullWebsite)
                                    }}
                                />
                            </div>

                            {websiteObj.pages !== undefined && (
                                <div style={{ display: selectionOption === "page" ? "grid" : "none", padding: "1rem" }}>
                                    <button className='mainButton' style={{ justifySelf: "flex-end" }}
                                        onClick={() => {
                                            addingPageSet(prev => !prev)
                                        }}
                                    >{addingPage ? (
                                        <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" /></svg>
                                    ) : (
                                        <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" /></svg>
                                    )}</button>

                                    {addingPage && (
                                        <AddEditPage sentWebsiteId={websiteObj.id} handleManagePage={handleManagePage} />
                                    )}

                                    {websiteObj.pages.length > 0 && (
                                        <>
                                            <label>Edit Pages</label>

                                            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                                                {websiteObj.pages.map(eachPage => {
                                                    return (
                                                        <div key={eachPage.id} style={{ border: "1px solid rgb(var(--shade1))" }}>
                                                            <AddEditPage sentPage={eachPage} sentWebsiteId={websiteObj.id} handleManagePage={handleManagePage} />

                                                            <ConfirmationBox text='' confirmationText='are you sure you want to delete the page?' successMessage='page deleted!'
                                                                icon={
                                                                    <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                                                                }
                                                                runAction={async () => {
                                                                    await deletePage(websiteObj.id, eachPage.id)

                                                                    //ensure page is no longer selected
                                                                    activePageIdSet(undefined)

                                                                    await refreshWebsitePath({ id: websiteObj.id })

                                                                    //send update that any other clients needs to refresh their pages
                                                                    sendWebsocketUpdate({
                                                                        type: "page",
                                                                        pageId: eachPage.id,
                                                                        refresh: true
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeUsedComponent !== undefined ? (
                                <>
                                    {websiteObj.usedComponents !== undefined &&
                                        (
                                            <div style={{ display: selectionOption === "component" ? "grid" : "none" }}>
                                                <>
                                                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: 'center', justifyContent: "space-between", padding: "1rem" }}>
                                                        <label>{activeUsedComponent.data.category} template</label>

                                                        {Object.hasOwn(activeUsedComponent.data, "children") && (
                                                            <button style={{ zIndex: 1 }}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(activeUsedComponent.id);

                                                                    toast.success("parent id copied to clipboard")
                                                                }}
                                                            >
                                                                <svg style={{ width: "1.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M208 0L332.1 0c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9L448 336c0 26.5-21.5 48-48 48l-192 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48zM48 128l80 0 0 64-64 0 0 256 192 0 0-32 64 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 176c0-26.5 21.5-48 48-48z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <ShowMore
                                                        label='Styling'
                                                        startShowing={true}
                                                        content={
                                                            <>
                                                                <ShowMore
                                                                    label='Css'
                                                                    startShowing={true}
                                                                    content={
                                                                        <textarea rows={5} value={activeUsedComponent.css} className={styles.styleEditor}
                                                                            onChange={(e) => {
                                                                                const newActiveComp: usedComponent = { ...activeUsedComponent }
                                                                                newActiveComp.css = e.target.value

                                                                                handleManageUsedComponents({ option: "update", seenUpdatedUsedComponent: newActiveComp })
                                                                            }}
                                                                            onBlur={() => {
                                                                                const newActiveComp: usedComponent = { ...activeUsedComponent }
                                                                                newActiveComp.css = formatCSS(newActiveComp.css)

                                                                                handleManageUsedComponents({ option: "update", seenUpdatedUsedComponent: newActiveComp })
                                                                            }}
                                                                        />
                                                                    }
                                                                />

                                                                <ShowMore
                                                                    label='set id, class'
                                                                    content={
                                                                        <>
                                                                            <input type='text' value={activeUsedComponent.data.mainElProps.id ?? ""} placeholder='Add an id to this element'
                                                                                onChange={(e) => {
                                                                                    const newActiveComp: usedComponent = { ...activeUsedComponent }
                                                                                    newActiveComp.data.mainElProps.id = e.target.value

                                                                                    handleManageUsedComponents({ option: "update", seenUpdatedUsedComponent: newActiveComp })
                                                                                }}
                                                                            />

                                                                            <input type='text' value={activeUsedComponent.data.mainElProps.className ?? ""} placeholder='Add css names here' style={{ marginTop: "1rem" }}
                                                                                onChange={(e) => {
                                                                                    const newActiveComp: usedComponent = { ...activeUsedComponent }
                                                                                    newActiveComp.data.mainElProps.className = e.target.value

                                                                                    handleManageUsedComponents({ option: "update", seenUpdatedUsedComponent: newActiveComp })
                                                                                }}
                                                                            />
                                                                        </>
                                                                    }
                                                                />
                                                            </>
                                                        }
                                                    />

                                                    <ShowMore
                                                        label="data"
                                                        content={
                                                            <TemplateDataSwitch location={activeLocation} activeUsedComponent={activeUsedComponent} seenUsedComponents={websiteObj.usedComponents} handlePropsChange={handlePropsChange} />
                                                        }
                                                    />

                                                    <ShowMore
                                                        label='replace'
                                                        content={
                                                            <>
                                                                {viewerTemplate === null ? (
                                                                    <button className='mainButton'
                                                                        onClick={() => {
                                                                            viewerTemplateSet({ usedComponentIdToSwap: activeUsedComponent.id, template: null, builtUsedComponent: null })
                                                                        }}
                                                                    >enable viewer node</button>
                                                                ) : (
                                                                    <button className='mainButton'
                                                                        onClick={() => {
                                                                            viewerTemplateSet(null)
                                                                        }}
                                                                    >cancel viewer node</button>
                                                                )}

                                                                {/* show options for active */}
                                                                {viewerTemplate !== null && viewerTemplate.usedComponentIdToSwap === activeUsedComponent.id && (
                                                                    <>
                                                                        <TemplateSelector websiteId={websiteObj.id} handleManageUsedComponents={handleManageUsedComponents} viewerTemplateSet={viewerTemplateSet} location={activeUsedComponent.location} seenUsedComponents={websiteObj.usedComponents} />

                                                                        {viewerTemplate.template !== null && (
                                                                            <button className='mainButton'
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        //replace the used component with this selection

                                                                                        //ensure the component info is there
                                                                                        if (viewerTemplate.template === null) return

                                                                                        //if usedComponents are the same type can reuse data
                                                                                        const reusingUsedComponentData = activeUsedComponent.data.category === viewerTemplate.template.categoryId

                                                                                        //replace everything except id, pageid, compid, children
                                                                                        const newReplacedUsedComponent: usedComponent = { ...activeUsedComponent, templateId: viewerTemplate.template.id, css: viewerTemplate.template.defaultCss, data: reusingUsedComponentData ? activeUsedComponent.data : viewerTemplate.template.defaultData, }

                                                                                        //send to update 
                                                                                        handleManageUsedComponents({ option: "update", seenUpdatedUsedComponent: newReplacedUsedComponent, rebuild: true })

                                                                                        viewerTemplateSet(null)

                                                                                        toast.success("swapped component")

                                                                                    } catch (error) {
                                                                                        consoleAndToastError(error)
                                                                                    }
                                                                                }}
                                                                            >replace with this component</button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        }
                                                    />

                                                    <ShowMore
                                                        label='order'
                                                        content={
                                                            <UsedComponentOrderSelector websiteId={websiteObj.id} seenUsedComponent={activeUsedComponent} seenUsedComponents={websiteObj.usedComponents} />
                                                        }
                                                    />

                                                    <ShowMore
                                                        label='change location'
                                                        content={
                                                            <UsedComponentLocationSelector websiteId={websiteObj.id} seenUsedComponent={activeUsedComponent} seenPages={websiteObj.pages !== undefined ? websiteObj.pages : []} />
                                                        }
                                                    />

                                                    <ShowMore
                                                        label='Delete Component'
                                                        content={
                                                            <ConfirmationBox text='delete' confirmationText='are you sure you want to delete' successMessage='deleted!' runAction={async () => {
                                                                await deleteUsedComponent(websiteObj.id, activeUsedComponent.id)

                                                                await refreshWebsitePath({ id: websiteObj.id })

                                                                //send update that any other clients needs to refresh their usedComponents
                                                                sendWebsocketUpdate({
                                                                    type: "usedComponent",
                                                                    usedComponentId: activeUsedComponent.id,
                                                                    refresh: true
                                                                })
                                                            }} />
                                                        }
                                                    />
                                                </>
                                            </div>
                                        )
                                    }
                                </>
                            ) : (
                                <label>Please select a component</label>
                            )}
                        </div>
                    </div>

                    <div className={styles.addOnMenu}>
                        {websiteObj.usedComponents !== undefined && (
                            <TemplateSelector websiteId={websiteObj.id} location={activeLocation} handleManageUsedComponents={handleManageUsedComponents} seenUsedComponents={websiteObj.usedComponents} />
                        )}

                        {showingSideBar && (
                            <>
                                <button className='secondaryButton toolTip' data-tooltip={"dim"} style={{ filter: dimSideBar ? "brightness(.4)" : "" }}
                                    onClick={() => {
                                        dimSideBarSet(prev => !prev)
                                    }}
                                >
                                    <svg style={{ fill: "rgb(var(--shade2))", width: "1.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c0 0 0 0 0 0c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c0 0 0 0 0 0c19.8 27.1 39.7 54.4 49.2 86.2l160 0zM192 512c44.2 0 80-35.8 80-80l0-16-160 0 0 16c0 44.2 35.8 80 80 80zM112 176c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-61.9 50.1-112 112-112c8.8 0 16 7.2 16 16s-7.2 16-16 16c-44.2 0-80 35.8-80 80z" /></svg>
                                </button>
                            </>
                        )}

                        <button className='secondaryButton toolTip' data-tooltip={`${showingSideBar ? "close" : "open"} side bar`}
                            onClick={() => {
                                showingSideBarSet(prev => {
                                    const newBool = !prev

                                    if (newBool) {
                                        dimSideBarSet(false)
                                    }

                                    return newBool
                                })
                            }}
                        >{showingSideBar ? (
                            <svg style={{ fill: "rgb(var(--shade2))", width: "1.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" /></svg>
                        ) : (
                            <svg style={{ fill: "rgb(var(--shade2))", width: "1.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l82.7 0L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3l0 82.7c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160c0-17.7-14.3-32-32-32L320 0zM80 32C35.8 32 0 67.8 0 112L0 432c0 44.2 35.8 80 80 80l320 0c44.2 0 80-35.8 80-80l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16L80 448c-8.8 0-16-7.2-16-16l0-320c0-8.8 7.2-16 16-16l112 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 32z" /></svg>
                        )}</button>
                    </div>
                </div>

                <DownloadOptions style={{ display: viewingDownloadOptions ? "" : "none" }} seenSession={seenSession} seenWebsite={websiteObj} seenGithubTokens={seenSession.user.userGithubTokens} viewingDownloadOptionsSet={viewingDownloadOptionsSet} />
            </div>
        </main>
    )
}

function RenderComponentTree({
    seenUsedComponents, originalUsedComponentsList, websiteObj, renderedUsedComponentsObj, tempActiveUsedComponentId, viewerTemplate
}: {
    seenUsedComponents: usedComponent[], originalUsedComponentsList: usedComponent[], websiteObj: website, renderedUsedComponentsObj: React.MutableRefObject<{ [key: string]: React.ComponentType<{ data: templateDataType; }> }>, tempActiveUsedComponentId: React.MutableRefObject<string>, viewerTemplate: viewerTemplateType | null
}) {

    return (
        <>
            {seenUsedComponents.map(eachUsedComponent => {
                let usingViewerTemplate = false

                let SeenViewerUsedComponent: React.ComponentType<{ data: templateDataType }> | null = null
                let seenViewerTemplateData: templateDataType | null = null

                //assign new chosen component if using the viewer node
                if (viewerTemplate !== null && viewerTemplate.usedComponentIdToSwap === eachUsedComponent.id && viewerTemplate.template !== null && viewerTemplate.builtUsedComponent !== null) {
                    usingViewerTemplate = true
                    SeenViewerUsedComponent = viewerTemplate.builtUsedComponent
                    seenViewerTemplateData = viewerTemplate.template.defaultData
                }

                const ComponentToRender = renderedUsedComponentsObj.current[eachUsedComponent.templateId];
                if (ComponentToRender === undefined) {
                    console.error(
                        `Component with ID ${eachUsedComponent.templateId} is not in renderedComponentsObj.`,
                        renderedUsedComponentsObj.current
                    );
                    return null;
                }

                let scopedCss = addScopeToCSS(eachUsedComponent.css, eachUsedComponent.id);

                const seenChildren: usedComponent[] = getChildrenUsedComponents(eachUsedComponent.id, originalUsedComponentsList)

                //order the children
                const seenOrderedChildren = sortUsedComponentsByOrder(seenChildren)

                // Recursively render child components
                const childJSX: React.JSX.Element | null = seenOrderedChildren.length > 0 ? <RenderComponentTree seenUsedComponents={seenOrderedChildren} originalUsedComponentsList={originalUsedComponentsList} websiteObj={websiteObj} renderedUsedComponentsObj={renderedUsedComponentsObj} tempActiveUsedComponentId={tempActiveUsedComponentId} viewerTemplate={viewerTemplate} /> : null;

                //apply scoped styling starter value
                eachUsedComponent.data.styleId = `____${eachUsedComponent.id}`

                // If the component is a container, pass children as a prop
                //handle chuldren for different categories
                if (childJSX !== null) {
                    if (eachUsedComponent.data.category === "containers") {
                        eachUsedComponent.data.children = childJSX
                    }
                }

                //add mouse over listener for interaction
                //@ts-expect-error mouseOver
                eachUsedComponent.data.mainElProps.onMouseOver = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                    e.stopPropagation()

                    tempActiveUsedComponentId.current = eachUsedComponent.id;

                    //highlight the element to show selection
                    const seenEl = e.currentTarget as HTMLElement;
                    seenEl.classList.add(styles.highlightComponent);
                }

                //@ts-expect-error mouseLeave
                eachUsedComponent.data.mainElProps.onMouseLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                    e.stopPropagation()

                    const seenEl = e.currentTarget as HTMLElement;

                    //remove the highlight 
                    seenEl.classList.remove(styles.highlightComponent);
                }

                //pass children to viewer component if valid
                if (seenViewerTemplateData !== null) {
                    if (seenViewerTemplateData.category === "containers") {

                        //check for the children attribute
                        seenViewerTemplateData.children = childJSX
                    }

                    //ensure css on component data is local
                    if (viewerTemplate !== null && viewerTemplate.template !== null) {
                        scopedCss = addScopeToCSS(viewerTemplate.template.defaultCss, eachUsedComponent.id);

                        seenViewerTemplateData.styleId = `____${eachUsedComponent.id}`
                    }
                }

                let seenElementId: string | undefined = undefined
                let seenElementClassNames: string | undefined = undefined

                //modify id and className of mainElProps render
                if (eachUsedComponent.data.mainElProps.className !== undefined) {
                    const seenClasses = eachUsedComponent.data.mainElProps.className.split(" ")
                    seenElementClassNames = seenClasses.map(eachClass => `${eachClass}____${eachUsedComponent.websiteId}`).join(" ")
                }

                if (eachUsedComponent.data.mainElProps.id !== undefined) {
                    seenElementId = `${eachUsedComponent.data.mainElProps.id}____${eachUsedComponent.websiteId}`
                }

                return (
                    <React.Fragment key={eachUsedComponent.id}>
                        <style>{scopedCss}</style>

                        {usingViewerTemplate ? (
                            <>
                                {SeenViewerUsedComponent !== null && seenViewerTemplateData !== null && (
                                    <SeenViewerUsedComponent data={seenViewerTemplateData} />
                                )}
                            </>
                        ) : (
                            <>
                                {/* Render the main component with injected props */}
                                <ComponentToRender data={{ ...eachUsedComponent.data, mainElProps: { ...eachUsedComponent.data.mainElProps, id: seenElementId, className: seenElementClassNames } }} />
                            </>
                        )}
                    </React.Fragment>
                );
            })}
        </>
    )
}