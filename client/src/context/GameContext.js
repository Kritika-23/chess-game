/**
 * GameContext — manages all game state across components
 */
import React, { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  roomId: null,
  playerName: '',
  myColor: null,       // 'white' | 'black'
  gameState: null,     // full state from server
  notification: null,  // { type: 'info'|'success'|'error'|'warn', message: string }
  notifications: [],
  restartPending: false, // waiting for opponent to accept restart
  phase: 'lobby',     // 'lobby' | 'waiting' | 'playing' | 'finished'
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'ROOM_JOINED':
      return {
        ...state,
        roomId: action.payload.roomId,
        myColor: action.payload.color,
        gameState: action.payload.state,
        phase: action.payload.state.status === 'active' ? 'playing' : 'waiting',
      };

    case 'ROOM_UPDATE':
      return {
        ...state,
        gameState: action.payload.state,
        phase: action.payload.state.status === 'active'
          ? 'playing'
          : action.payload.state.status === 'finished'
          ? 'finished'
          : 'waiting',
      };

    case 'MOVE_MADE':
      return {
        ...state,
        gameState: action.payload.state,
      };

    case 'GAME_OVER':
      return {
        ...state,
        gameState: action.payload.state,
        phase: 'finished',
      };

    case 'GAME_RESTARTED':
      return {
        ...state,
        gameState: action.payload.state,
        myColor: action.payload.state.players.white?.socketId === state.myColor ? 'white' : 'black',
        phase: 'playing',
        restartPending: false,
      };

    case 'UPDATE_TIMERS':
      return {
        ...state,
        gameState: state.gameState
          ? { ...state.gameState, timers: action.payload.timers }
          : state.gameState,
      };

    case 'SET_NOTIFICATION': {
      const notification = {
        id: action.payload.id || Date.now(),
        type: action.payload.type || 'info',
        message: action.payload.message,
      };

      return {
        ...state,
        notification,
        notifications: [...state.notifications, notification].slice(-4),
      };
    }

    case 'CLEAR_NOTIFICATION': {
      if (!action.payload) {
        return { ...state, notification: null, notifications: [] };
      }

      const notifications = state.notifications.filter((item) => item.id !== action.payload);
      return {
        ...state,
        notification: notifications[notifications.length - 1] || null,
        notifications,
      };
    }

    case 'SET_RESTART_PENDING':
      return { ...state, restartPending: action.payload };

    case 'LEAVE_GAME':
      return { ...initialState };

    case 'SET_MY_COLOR':
      return { ...state, myColor: action.payload };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const notify = useCallback((type, message, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'SET_NOTIFICATION', payload: { id, type, message } });
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION', payload: id }), duration);
    }
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, notify }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
