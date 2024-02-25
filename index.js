import { WebSocketServer, WebSocket } from "ws";
import { PlayersDB } from "./src/DB/players.js";
import { RoomsDB } from "./src/DB/rooms.js";
import { isHit, isShipKilled, isShot, getHitsAroundShip } from "./src/helpers/game.js";
import { httpServer } from "./src/http_server/index.js";

const WS_PORT = 3000;
const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const playersDB = new PlayersDB();
const roomsDB = new RoomsDB();

const formatResponse = (type, data, id = 0) => {
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id,
  });
};

const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const updateRooms = () => {
  const availableRooms = roomsDB.getAvailableRooms();
  console.log(availableRooms)
  const response = formatResponse("update_room", availableRooms);
  broadcast(response);
};

const updateWinners = () => {
  const winners = playersDB.getWinners();
  const response = formatResponse("update_winners", winners);
  broadcast(response);
};

const createGame = (room) => {
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      room.roomUsers.some((roomUser) => roomUser.index === client.user?.index)
    ) {
      client.send(
        formatResponse("create_game", {
          idGame: room.roomId,
          idPlayer: client.user.index,
        })
      );
    }
  });
};

const attack = (gameId, indexPlayer, x, y) => {
  const room = roomsDB.getRoom(gameId);
  const currentPlayer =roomsDB.getRoomUser(gameId, room.currentPlayerIndex);

  if (!currentPlayer || currentPlayer.index !== indexPlayer) return;

  const nextPlayer = roomsDB.getNextPlayer(gameId);

  if (!nextPlayer) {
    console.error("Next player not found");
    return;
  }

  const doubleHit = isHit(nextPlayer, x, y);

  if (doubleHit) {
    console.log("Double hit");
    return;
  }

  nextPlayer.hits.push({ x, y });

  const shotShip = isShot(nextPlayer, x, y);

  let status = "miss";

  if (!shotShip) {
    room.currentPlayerIndex = nextPlayer.index;
  } else {
    status = isShipKilled(nextPlayer, shotShip) ? "killed" : "shot";
  }

  const hitsAround =
    status === "killed" ? getHitsAroundShip(nextPlayer, shotShip) : [];
  nextPlayer.hits = nextPlayer.hits.concat(hitsAround);

  const isGameOver = nextPlayer.ships.every((ship) => {
    return isShipKilled(nextPlayer, ship);
  });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    const player = room.roomUsers.find(
      (roomUser) => roomUser.index === client.user?.index
    );

    if (!player) return;

    const response = {
      position: { x, y },
      status: status,
      currentPlayer: currentPlayer.index,
    };

    client.send(formatResponse("attack", response));

    hitsAround.forEach((hit) => {
      const response = {
        position: { x: hit.x, y: hit.y },
        status: "miss",
        currentPlayer: currentPlayer.index,
      };
      client.send(formatResponse("attack", response));
    });

    if (isGameOver) {
      client.send(formatResponse("finish", { winPlayer: currentPlayer.index }));
    } else {
      client.send(
        formatResponse("turn", { currentPlayer: room.currentPlayerIndex })
      );
    }
  });

  if (isGameOver) {
    const winner = roomsDB.getRoomUser(room.roomId, currentPlayer.index);
    userWin(winner.name);
    updateWinners();
    deleteRoom(room.roomId);
  }
};

console.log(`Start WebSocket server on the ${WS_PORT} port!`);
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("close", function close() {
    if (this.user) {
      const room = roomsDB.getRoomByUser(this.user.index);
      if (!room) return;
      const aponent = roomsDB.getAponent(room.roomId, this.user.index);
      if (aponent) {
        playersDB.userWin(aponent.name);
        updateWinners();
        broadcast(formatResponse("finish", { winPlayer: aponent.index }));
      }
      roomsDB.deleteRoom(room.roomId);
      updateRooms();
    }
  });

  ws.on("message", function message(data) {
    const parsedData = JSON.parse(data);
    const payload = parsedData.data === "" ? "" : JSON.parse(parsedData.data);

    // REGISTRATION AND AUTHORIZATION
    if (parsedData.type === "reg") {
      if (playersDB.isPlayerExist(payload.name)) {
        if (playersDB.checkPlayer(payload.name, payload.password)) {
          const user = playersDB.getPlayer(payload.name);
          this.user = user;
          const response = {
            name: user.name,
            index: user.index,
            error: false,
          };
          ws.send(formatResponse("reg", response));
          updateRooms();
          updateWinners();
        } else {
          const response = {
            name: payload.name,
            error: true,
            errorText: "Wrong password",
          };
          ws.send(formatResponse("reg", response));
        }
      } else {
        playersDB.addPlayer(payload.name, payload.password);
        const user = playersDB.getPlayer(payload.name);
        this.user = user;
        const response = { name: user.name, index: user.index, error: false };
        ws.send(formatResponse("reg", response));
        updateRooms();
        updateWinners();
      }

      // CREATE ROOM
    } else if (parsedData.type === "create_room") {
      const room = roomsDB.createRoom();
      roomsDB.addRoomUser(room.roomId, this.user);
      updateRooms();

      // ADD USER TO ROOM
    } else if (parsedData.type === "add_user_to_room") {
      const room = roomsDB.getRoom(payload.indexRoom);

      if (roomsDB.addRoomUser(room.roomId, this.user)) {
        updateRooms();
        createGame(room);
      }

      // RECEIVE SHIPS POSITIONS
    } else if (parsedData.type === "add_ships") {
      const room = roomsDB.getRoom(payload.gameId);
      const user = roomsDB.getRoomUser(payload.gameId, payload.indexPlayer);
      user.ships = payload.ships;

      if (roomsDB.gameCanStart(room)) {
        room.currentPlayerIndex = room.roomUsers[0].index;
        wss.clients.forEach((client) => {
          if (client.readyState !== WebSocket.OPEN) return;

          const player = roomsDB.getRoomUser(room.roomId, client.user?.index);
          if (!player) return;

          const response = {
            ships: player.ships,
            currentPlayerIndex: room.currentPlayerIndex,
          };
          client.send(formatResponse("start_game", response));
        });
      }

      // ATTACK
    } else if (parsedData.type === "attack") {
      const gameId = payload.gameId;
      const indexPlayer = payload.indexPlayer;
      const x = payload.x;
      const y = payload.y;
      attack(gameId, indexPlayer, x, y);

      // RANDOM ATTACK
    } else if (parsedData.type === "randomAttack") {
      const gameId = payload.gameId;
      const indexPlayer = payload.indexPlayer;
      const nextPlayer = roomsDB.getNextPlayer(gameId);
      let x = Math.floor(Math.random() * 10);
      let y = Math.floor(Math.random() * 10);
      while (isHit(nextPlayer, x, y)) {
        x = Math.floor(Math.random() * 10);
        y = Math.floor(Math.random() * 10);
      }
      attack(gameId, indexPlayer, x, y);
    }
  });
});