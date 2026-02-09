import app from "./app.ts";
import { env } from "./config/env.ts";
import { WebsocketHandler } from "./services/websocketHandler.ts";

const server = app.listen(env.PORT, "0.0.0.0", async () => {
    console.log(`Listening on port ${env.PORT}`);
});

WebsocketHandler(server);