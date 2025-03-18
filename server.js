const { parse } = require("url");
const { createServer } = require("http");
const next = require("next");
const { WebSocket, WebSocketServer } = require("ws");

const nextApp = next({ dev: process.env.NODE_ENV !== "production" });
const handle = nextApp.getRequestHandler();

const rooms = new Map();

nextApp.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res, parse(req.url || "", true));
    });

    const wss = new WebSocketServer({ noServer: true });

    wss.on("connection", (ws) => {
        let userWebsiteId = null;

        ws.on("message", (message, isBinary) => {
            try {
                const receivedMessage = JSON.parse(message.toString());

                if (receivedMessage.type === "join") {
                    userWebsiteId = receivedMessage.websiteId;
                    console.log(`User joining room: ${userWebsiteId}`);

                    if (!rooms.has(userWebsiteId)) {
                        rooms.set(userWebsiteId, new Set());
                    }

                    rooms.get(userWebsiteId).add(ws);
                }

                if (receivedMessage.type === "standard") {
                    const websiteId = receivedMessage.data.websiteId;

                    if (!rooms.has(websiteId)) {
                        console.log(`No room found for websiteId: ${websiteId}`);
                        return;
                    }

                    rooms.get(websiteId).forEach((client) => {
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
            if (userWebsiteId && rooms.has(userWebsiteId)) {
                rooms.get(userWebsiteId).delete(ws);

                if (rooms.get(userWebsiteId).size === 0) {
                    rooms.delete(userWebsiteId);
                }
            }

            console.log(`Client disconnected from room: ${userWebsiteId}`);
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

    server.listen(3000);
    console.log("Server listening on port 3000");
});
