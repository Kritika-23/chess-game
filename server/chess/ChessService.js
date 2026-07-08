const chessEngine = require('./ChessEngine');
const timerManager = require('./TimerManager');
const { getRoomPublicState } = require('./GameState');
const { validateMoveRequest } = require('./MoveValidator');
const { ROOM_STATUS } = require('../utils/constants');
const { AppError } = require('../utils/errors');

class ChessService {
  getPublicState(room) {
    return getRoomPublicState(room);
  }

  startTimer(room, handlers) {
    timerManager.start(room, handlers);
  }

  stopTimer(room) {
    timerManager.stop(room);
  }

  makeMove({ room, color, from, to, promotion }) {
    validateMoveRequest({ room, color });

    const move = chessEngine.move(room, { from, to, promotion });
    if (!move) {
      throw new AppError('Illegal move');
    }

    if (move.captured) {
      room.capturedPieces[color].push(move.captured);
    }

    room.moveHistory.push({
      san: move.san,
      from: move.from,
      to: move.to,
      piece: move.piece,
      color: move.color,
      captured: move.captured || null,
      flags: move.flags,
      fen: room.chess.fen(),
      moveNumber: Math.ceil(room.moveHistory.length / 2) + 1,
    });

    if (chessEngine.isGameOver(room)) {
      timerManager.stop(room);
      room.status = ROOM_STATUS.FINISHED;
      room.result = chessEngine.getResult(room, color);
      return {
        event: 'gameOver',
        move,
        result: room.result,
        state: this.getPublicState(room),
      };
    }

    return {
      event: 'moveMade',
      move,
      state: this.getPublicState(room),
    };
  }

  resign(room, color) {
    if (!room || room.status !== ROOM_STATUS.ACTIVE) return null;

    timerManager.stop(room);
    room.status = ROOM_STATUS.FINISHED;
    room.result = {
      winner: color === 'white' ? 'black' : 'white',
      reason: 'resignation',
    };

    return {
      result: room.result,
      state: this.getPublicState(room),
    };
  }

  resetForRestart(room) {
    timerManager.stop(room);
    chessEngine.reset(room);
    room.moveHistory = [];
    room.capturedPieces = { white: [], black: [] };
    room.status = ROOM_STATUS.ACTIVE;
    room.result = null;
    timerManager.reset(room);
  }
}

module.exports = new ChessService();
