/**
 * Socket hooks for room/game events and outbound actions.
 */
import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';

function soundForMove(move, gameState) {
  if (gameState?.isCheckmate) return 'checkmate';
  if (gameState?.inCheck) return 'check';
  if (move?.captured) return 'capture';
  return 'move';
}

export function useChessSocketListeners() {
  const socket = useSocket();
  const { state, dispatch, notify } = useGame();
  const { playSound } = useSound();

  useEffect(() => {
    if (!socket) return undefined;

    const handleConnect = () => {
      if (!state.roomId || !state.playerName || !state.myColor) return;
      console.info('[socket] reconnecting to room', state.roomId);
      socket.emit('reconnectToRoom', {
        roomId: state.roomId,
        playerName: state.playerName,
        color: state.myColor,
      });
    };

    const handleRoomJoined = (data) => {
      dispatch({ type: 'ROOM_JOINED', payload: data });
      notify('success', `Joined as ${data.color === 'white' ? 'White' : 'Black'}`, 3000);
    };

    const handleRoomUpdate = (data) => {
      dispatch({ type: 'ROOM_UPDATE', payload: data });
      if (data.state.status === 'active' && data.state.players.white && data.state.players.black) {
        playSound('gameStart');
        notify('success', 'Both players ready - game started!', 3000);
      }
    };

    const handleMoveMade = (data) => {
      dispatch({ type: 'MOVE_MADE', payload: data });
      playSound(soundForMove(data.move, data.state));
    };

    const handleGameOver = (data) => {
      dispatch({ type: 'GAME_OVER', payload: data });
      const { winner, reason } = data.result;

      let msg = '';
      if (reason === 'checkmate') msg = `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`;
      else if (reason === 'stalemate') msg = 'Stalemate - draw!';
      else if (reason === 'draw') msg = 'Draw!';
      else if (reason === 'resignation') msg = `${winner === 'white' ? 'White' : 'Black'} wins by resignation!`;
      else if (reason === 'timeout') msg = `${winner === 'white' ? 'White' : 'Black'} wins on time!`;

      playSound(reason === 'checkmate' ? 'checkmate' : 'gameOver');
      notify('info', msg, 0);
    };

    const handleTimerUpdate = (data) => {
      dispatch({ type: 'UPDATE_TIMERS', payload: data });
    };

    const handlePlayerDisconnected = ({ color }) => {
      notify('warn', `${color === 'white' ? 'White' : 'Black'} disconnected. Waiting for reconnect...`, 0);
    };

    const handlePlayerReconnected = ({ color }) => {
      notify('success', `${color === 'white' ? 'White' : 'Black'} reconnected!`, 3000);
    };

    const handleRestartRequested = ({ by }) => {
      notify('info', `${by === 'white' ? 'White' : 'Black'} wants a rematch!`, 0);
      dispatch({ type: 'SET_RESTART_PENDING', payload: 'incoming' });
    };

    const handleGameRestarted = (data) => {
      dispatch({ type: 'GAME_RESTARTED', payload: data });
      playSound('gameStart');
      notify('success', 'New game started! Colors swapped.', 3000);
    };

    const handleReconnected = (data) => {
      dispatch({ type: 'ROOM_JOINED', payload: data });
      notify('success', 'Reconnected to game!', 3000);
    };

    const handleError = ({ message }) => {
      playSound(message?.toLowerCase().includes('move') ? 'illegal' : 'gameOver');
      notify('error', message, 4000);
    };

    socket.on('connect', handleConnect);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('moveMade', handleMoveMade);
    socket.on('gameOver', handleGameOver);
    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('playerReconnected', handlePlayerReconnected);
    socket.on('restartRequested', handleRestartRequested);
    socket.on('gameRestarted', handleGameRestarted);
    socket.on('reconnected', handleReconnected);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('roomUpdate', handleRoomUpdate);
      socket.off('moveMade', handleMoveMade);
      socket.off('gameOver', handleGameOver);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('playerDisconnected', handlePlayerDisconnected);
      socket.off('playerReconnected', handlePlayerReconnected);
      socket.off('restartRequested', handleRestartRequested);
      socket.off('gameRestarted', handleGameRestarted);
      socket.off('reconnected', handleReconnected);
      socket.off('error', handleError);
    };
  }, [socket, state.roomId, state.playerName, state.myColor, dispatch, notify, playSound]);
}

export function useChessSocketActions() {
  const socket = useSocket();
  const { dispatch } = useGame();

  const joinRoom = useCallback((roomId, playerName) => {
    if (!socket) return;
    console.info('[socket] joinRoom', roomId);
    socket.emit('joinRoom', { roomId, playerName });
  }, [socket]);

  const makeMove = useCallback((from, to, promotion) => {
    if (!socket) return;
    socket.emit('makeMove', { from, to, promotion });
  }, [socket]);

  const resign = useCallback(() => {
    if (!socket) return;
    socket.emit('resign');
  }, [socket]);

  const requestRestart = useCallback(() => {
    if (!socket) return;
    socket.emit('requestRestart');
    dispatch({ type: 'SET_RESTART_PENDING', payload: 'outgoing' });
  }, [socket, dispatch]);

  const acceptRestart = useCallback(() => {
    if (!socket) return;
    socket.emit('acceptRestart');
    dispatch({ type: 'SET_RESTART_PENDING', payload: false });
  }, [socket, dispatch]);

  const declineRestart = useCallback(() => {
    dispatch({ type: 'SET_RESTART_PENDING', payload: false });
    dispatch({ type: 'CLEAR_NOTIFICATION' });
  }, [dispatch]);

  return { joinRoom, makeMove, resign, requestRestart, acceptRestart, declineRestart };
}
