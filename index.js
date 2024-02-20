import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer } from 'ws';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

// Создаем WebSocket сервер на указанном порту
const wss = new WebSocketServer({ port: 3000 });

// Обработчик события при подключении клиента к серверу
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  // Обработчик сообщений от клиента
  ws.on("message", (message) => {
    console.log(`Received message from client: ${message}`);

    // Отправляем обратно клиенту полученное сообщение
    ws.send(`You said: ${message}`);
  });

  // Обработчик закрытия соединения
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

console.log(`WebSocket server running!`);
