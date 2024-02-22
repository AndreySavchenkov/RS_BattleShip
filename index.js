import { DB } from "./src/DB/index.js";
import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer } from "ws";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WS_PORT });

const InMemoryDB = new DB();

// Обработчик события при подключении клиента к серверу
wss.on("connection", (ws) => {
  
  const connectionId = Math.random().toString(36).substr(2, 9);
  console.log(`WebSocket client connected with ${connectionId} connection id`);
  

  // Обработчик сообщений от клиента
  ws.on("message", (message) => {
    const parseMessage = JSON.parse(message);
    const { type } = parseMessage;

    console.log(`Received message from client: ${parseMessage}`);

    if (type === "reg") {
      const { name, password } = JSON.parse(parseMessage.data);
      InMemoryDB.addPlayer(name, password, connectionId);

      console.log(`Player ${name} added successful!`);

      const { index } = InMemoryDB.getPlayer(name);

      ws.send(
        JSON.stringify({
          type: "reg",
          data: JSON.stringify({
            name: name,
            index: index,
            error: false,
            errorText: "",
          }),
          id: 0,
        })
      );

      ws.send(
        JSON.stringify({
          type: "update_winners",
          data: [],
          id: 0,
        })
      );

      ws.send(
        JSON.stringify({
          type: "update_room",
          data: [],
          id: 0,
        })
      );
    }

    if (type === "create_room") {
      const user = InMemoryDB.getAllPlayers()?.find((item) => item.connectionId === connectionId);
      const { name, index } = user;

      ws.send(
        JSON.stringify({
          type: "update_room",
          data: JSON.stringify([
            {
              roomId: 0,
              roomUsers: [
                {
                  name: name,
                  index: index,
                },
              ],
            },
          ]),
          id: 0,
        })
      );
    }

    console.dir(InMemoryDB.getAllPlayers());
  });

  // Обработчик закрытия соединения
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

console.log(`WebSocket server running!`);
