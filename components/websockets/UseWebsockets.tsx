import { webSocketMessageJoinSchema, webSocketMessageJoinType, webSocketMessagePingType, webSocketStandardMessageSchema, webSocketStandardMessageType } from '@/types';
import { useEffect, useRef, useState } from 'react'

export default function useWebsockets(receivedMessageFunction: (webSocketStandardMessage: webSocketStandardMessageType) => void, useEffectRefresher: unknown[] = []) {
    const wsRef = useRef<WebSocket | null>(null);
    const [websocketsconnected, webSocketsConnectedSet] = useState(false)

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

            receivedMessageFunction(seenMessage)
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

            if (wsRef.current !== null) {
                wsRef.current.close();
            }
        };
    }, useEffectRefresher)

    //send messages
    function sendWebsocketUpdate(updateOption: webSocketStandardMessageType["data"]["updated"]) {
        if (wsRef.current === null) return

        const newWebSocketsMessage: webSocketStandardMessageType = {
            type: "standard",
            data: {
                updated: updateOption
            }
        }

        webSocketStandardMessageSchema.parse(newWebSocketsMessage)

        if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(newWebSocketsMessage));
        }
    }

    return { websocketsconnected, sendWebsocketUpdate }
}
