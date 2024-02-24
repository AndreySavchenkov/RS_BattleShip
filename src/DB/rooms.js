export class RoomsDB {
  constructor() {
    this.rooms = [];
  }

  createRoom() {
    const room = { roomId: this.rooms.length + 1, roomUsers: [] };
    this.rooms.push(room);
  }

  deleteRoom(roomId) {
    const roomIndex = this.rooms.findIndex((room) => room.roomId === roomId);
    this.rooms.splice(roomIndex, 1);
  }

  getRoom(roomId) {
    return this.rooms.find((room) => room.roomId === roomId);
  }

  getRoomByUser(userIndex) {
    return this.rooms.find((room) =>
      room.roomUsers.some((roomUser) => roomUser.index === userIndex)
    );
  }

  addRoomUser = (roomId, user) => {
    const room = getRoom(roomId);

    if (
      room.roomUsers.length === 2 ||
      room.roomUsers.some((roomUser) => roomUser.index === user.index)
    )
      return false;

    const roomUser = {
      name: user.name,
      index: user.index,
      ships: [],
      hits: [],
    };
    room.roomUsers.push(roomUser);
    return room;
  };

  getRoomUser(roomId, userIndex) {
    const room = getRoom(roomId);

    if (!room) {
      console.error("Room not found");
      return false;
    }

    return room.roomUsers.find((user) => user.index === userIndex);
  }

  getCurrentPlayer(roomId) {
    const room = getRoom(roomId);

    if (!room) {
      console.error("Room not found");
      return false;
    }

    const currentPlayer = room.roomUsers.find(
      (user) => user.index === room.currentPlayerIndex
    );

    return currentPlayer;
  }

  getNextPlayer(roomId) {
    const room = getRoom(roomId);

    if (!room) {
      console.error("Room not found");
      return false;
    }

    const nextPlayer = room.roomUsers.find(
      (user) => user.index !== room.currentPlayerIndex
    );

    return nextPlayer;
  }

  getAponent(roomId, userIndex) {
    const room = getRoom(roomId);

    if (!room) {
      console.error("Room not found");
      return false;
    }

    const aponent = room.roomUsers.find((user) => user.index !== userIndex);
    return aponent;
  }

  getAvailableRooms() {
    rooms.reduce((prev, curr) => {
      if (curr.roomUsers.length < 2) {
        const roomUsers = curr.roomUsers.map((user) => {
          return {
            name: user.name,
            index: user.index,
          };
        });
        prev.push({
          roomId: curr.roomId,
          roomUsers: roomUsers,
        });
      }
      return prev;
    }, []);
  }
}
