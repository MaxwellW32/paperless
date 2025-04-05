const { parse } = require("url");
const { createServer } = require("http");
const next = require("next");
const { WebSocket, WebSocketServer } = require("ws");

const nextApp = next({ dev: process.env.NODE_ENV !== "production" });
const handle = nextApp.getRequestHandler();

let websocketConnections = []

nextApp.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res, parse(req.url || "", true));
    });

    const wss = new WebSocketServer({ noServer: true });

    wss.on("connection", (ws) => {
        ws.on("message", (message, isBinary) => {
            try {
                const receivedMessage = JSON.parse(message.toString());

                if (receivedMessage.type === "join") {
                    if (!websocketConnections.includes(ws)) {
                        websocketConnections.push(ws);
                    }

                } else if (receivedMessage.type === "standard") {
                    websocketConnections.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(receivedMessage), { binary: isBinary });
                        }
                    });
                }

            } catch (error) {
                console.error("WebSocket message error:", error);
            }
        });

        ws.on("close", () => {
            if (websocketConnections.includes(ws)) {
                websocketConnections = websocketConnections.filter((client) => client !== ws);
            }

            console.log(`Client disconnected`);
        });
    });

    server.on("upgrade", (req, socket, head) => {
        const { pathname } = parse(req.url || "/", true);

        if (pathname === "/_next/webpack-hmr") {
            nextApp.getUpgradeHandler()(req, socket, head);
        }

        if (pathname === "/api/ws") {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        }
    });

    server.listen(3001);
    console.log("Server listening on port 3001");
});
