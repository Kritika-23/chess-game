const ROOM_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
};

const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};

const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'joinRoom',
  ROOM_JOINED: 'roomJoined',
  ROOM_UPDATE: 'roomUpdate',
  MAKE_MOVE: 'makeMove',
  MOVE_MADE: 'moveMade',
  GAME_OVER: 'gameOver',
  TIMER_UPDATE: 'timerUpdate',
  RESIGN: 'resign',
  REQUEST_RESTART: 'requestRestart',
  RESTART_REQUESTED: 'restartRequested',
  ACCEPT_RESTART: 'acceptRestart',
  GAME_RESTARTED: 'gameRestarted',
  PLAYER_DISCONNECTED: 'playerDisconnected',
  PLAYER_RECONNECTED: 'playerReconnected',
  RECONNECT_TO_ROOM: 'reconnectToRoom',
  RECONNECTED: 'reconnected',
  ERROR: 'error',
};

const GAME_CONFIG = {
  INITIAL_TIME_SECONDS: 600,
  ROOM_CODE_LENGTH: 8,
  ROOM_CLEANUP_DELAY_MS: 30 * 60 * 1000,
};

module.exports = {
  ROOM_STATUS,
  COLORS,
  SOCKET_EVENTS,
  GAME_CONFIG,
};
