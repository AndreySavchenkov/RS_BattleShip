export class DB {
  constructor() {
    this.players = [];
  }

  isPlayerExist = (name) => {
    return this.players.some((player) => player.name === name);
  }

  checkPlayer = (name, password) => {
    return this.players.some((player) => player.name === name && player.password === password);
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
