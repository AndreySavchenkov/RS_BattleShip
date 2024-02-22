export class DB {
  constructor() {
    this.players = [];
  }

  addPlayer(username, password, connectionId) {
    this.players.push({
      name: username,
      password,
      index: this.players.length + 1,
      connectionId,
    });
  }

  getPlayer(username) {
    return this.players.find((user) => user.name === username);
  }

  getAllPlayers() {
    return this.players;
  }
}
