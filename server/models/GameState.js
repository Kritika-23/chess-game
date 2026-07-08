function createGameState(room) {
  return {
    id: room.id,
    fen: room.chess.fen(),
    players: room.players,
    moveHistory: room.moveHistory,
    capturedPieces: room.capturedPieces,
    status: room.status,
    result: room.result,
    timers: room.timers,
    turn: room.chess.turn(),
    inCheck: room.chess.inCheck(),
    isCheckmate: room.chess.isCheckmate(),
    isStalemate: room.chess.isStalemate(),
    isDraw: room.chess.isDraw(),
    isGameOver: room.chess.isGameOver(),
  };
}

module.exports = {
  createGameState,
};
