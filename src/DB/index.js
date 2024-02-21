export class DB {
  constructor() {
    this.players = [];
  }

  addPlayer(username, password) {
    this.players.push({
      name: username,
      password,
      index: this.players.length + 1,
    });
  }

  getPlayer(username) {
    return this.players.find((user) => user.name === username);
  }

  getAllPlayers() {
    return this.players;
  }
}
