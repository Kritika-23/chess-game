const { Chess } = require('chess.js');

class ChessEngine {
  createGame() {
    return new Chess();
  }

  reset(room) {
    room.chess = this.createGame();
  }

  move(room, { from, to, promotion }) {
    try {
      return room.chess.move({ from, to, promotion: promotion || 'q' });
    } catch (error) {
      return null;
    }
  }

  isGameOver(room) {
    return room.chess.isGameOver();
  }

  getResult(room, winnerColor) {
    if (room.chess.isCheckmate()) {
      return { winner: winnerColor, reason: 'checkmate' };
    }

    if (room.chess.isStalemate()) {
      return { winner: null, reason: 'stalemate' };
    }

    if (room.chess.isDraw()) {
      return { winner: null, reason: 'draw' };
    }

    return null;
  }

  getCurrentTurnColor(room) {
    return room.chess.turn() === 'w' ? 'white' : 'black';
  }
}

module.exports = new ChessEngine();
