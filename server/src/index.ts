import http from "http";
import app from "./app.ts";
import { env } from "./config/env.ts";
import { WebsocketHandler } from "./ai/websocketHandler.ts";

const server = http.createServer(app);

WebsocketHandler(server);

server.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Listening on port ${env.PORT}`);
});
