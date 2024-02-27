export class PlayersDB {
  constructor() {
    this.players = [];
  }

  isPlayerExist = (name) => {
    return this.players.some((player) => player.name === name);
  };

  checkPlayer = (name, password) => {
    return this.players.some(
      (player) => player.name === name && player.password === password
    );
  };

  addPlayer(username, password) {
    this.players.push({
      index: this.players.length + 1,
      wins: 0,
      name: username,
      password,
    });
  }

  getPlayer(username) {
    return this.players.find((user) => user.name === username);
  }

  getAllPlayers() {
    return this.players;
  }

  playerWin(name) {
    const user = this.users.find((user) => user.name === name);
    user.wins++;
  }

  getWinners = () => {
    return this.players
      .filter((user) => user.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10)
      .map((user) => {
        return {
          name: user.name,
          wins: user.wins,
        };
      });
  };
}
