import { DB } from "./src/DB/index.js";
import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer } from "ws";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WS_PORT });

const InMemoryDB = new DB();

const formatResponse = (type, data, id = 0) => {
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id,
  });
};

wss.on("connection", (ws) => {
  const connectionId = Math.random().toString(36).substr(2, 9);
  console.log(`WebSocket client connected with ${connectionId} connection id`);

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    const payload =
      parsedMessage.data === "" ? "" : JSON.parse(parsedMessage.data);
    const type = parsedMessage.type;

    console.log(`Received message from client: ${parsedMessage}`);

    //REGISTRATION
    if (type === "reg") {
      if (InMemoryDB.isPlayerExist(payload.name)) {
        if (InMemoryDB.checkPlayer(payload.name, payload.password)) {
          const { index, name } = InMemoryDB.getPlayer(payload.name);

          const response = { name, index, error: false };
          ws.send(formatResponse("reg", response));
          ws.send(formatResponse("update_room", {}));
          ws.send(formatResponse("update_winners", {}));
        } else {
          const response = {
            name: payload.name,
            error: true,
            errorText: "Wrong password :(",
          };
          ws.send(formatResponse("reg", response));
        }
      } else {
        InMemoryDB.addPlayer(payload.name, payload.password, connectionId);
        const { name, index } = InMemoryDB.getPlayer(payload.name);
        
        const response = { name, index, error: false };
        ws.send(formatResponse("reg", response));
        ws.send(formatResponse("update_room", {}));
        ws.send(formatResponse("update_winners", {}));
      }
    }

    //CREATE ROOM
    else if (type === "create_room") {
    }

    console.dir(InMemoryDB.getAllPlayers());
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

console.log(`WebSocket server running!`);
