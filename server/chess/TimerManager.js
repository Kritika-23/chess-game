const { GAME_CONFIG } = require('../utils/constants');

class TimerManager {
  start(room, handlers = {}) {
    this.stop(room);

    room.timerInterval = setInterval(() => {
      const currentTurn = room.chess.turn() === 'w' ? 'white' : 'black';
      room.timers[currentTurn] -= 1;

      if (handlers.onTick) {
        handlers.onTick(room);
      }

      if (room.timers[currentTurn] <= 0) {
        room.timers[currentTurn] = 0;
        this.stop(room);

        const winner = currentTurn === 'white' ? 'black' : 'white';
        if (handlers.onTimeout) {
          handlers.onTimeout(room, winner);
        }
      }
    }, 1000);
  }

  stop(room) {
    if (room?.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
  }

  reset(room) {
    room.timers = {
      white: GAME_CONFIG.INITIAL_TIME_SECONDS,
      black: GAME_CONFIG.INITIAL_TIME_SECONDS,
    };
  }
}

module.exports = new TimerManager();
