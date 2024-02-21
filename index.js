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
  console.log("WebSocket client connected");

  // Обработчик сообщений от клиента
  ws.on("message", (message) => {
    const parseMessage = JSON.parse(message);
    const { type } = parseMessage;
    const { name, password } = JSON.parse(parseMessage.data);

    console.log(`Received message from client: ${parseMessage}`);

    if (type === "reg") {
      InMemoryDB.addPlayer(name, password);
      console.log(`Player ${name} added successful!`);

      const {index} = InMemoryDB.getPlayer(name);

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
          data: JSON.stringify({
            name: name,
            wins: 1,
          }),
          id: 0,
        })
      );
    }

    console.dir(InMemoryDB.getAllPlayers());
    // ws.send(`You said: ${message}`);
  });

  // Обработчик закрытия соединения
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

console.log(`WebSocket server running!`);
