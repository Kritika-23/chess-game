/**
 * GamePage — the main playing screen: board, panels, controls
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useChessSocketActions } from '../hooks/useChessSocket';
import ChessBoardView from '../components/ChessBoardView';
import PlayerBar from '../components/PlayerBar';
import MoveHistory from '../components/MoveHistory';
import CapturedPieces from '../components/CapturedPieces';
import StatusBanner from '../components/StatusBanner';
import GameOverModal from '../components/GameOverModal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function GamePage() {
  const { state, dispatch } = useGame();
  const { makeMove, resign } = useChessSocketActions();
  const { gameState, myColor, roomId } = state;
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [boardWidth, setBoardWidth] = useState(480);

  // Responsive board sizing
  useEffect(() => {
    function updateSize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw < 640) {
        setBoardWidth(Math.min(vw - 32, 420));
      } else if (vw < 1024) {
        setBoardWidth(Math.min(vw * 0.55, 480));
      } else {
        setBoardWidth(Math.min(vh * 0.65, 560));
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMove = useCallback((from, to, promotion) => {
    makeMove(from, to, promotion);
  }, [makeMove]);

  if (!gameState) return <SkeletonLoader variant="board" />;

  const { players, status, turn, moveHistory, capturedPieces } = gameState;
  const currentTurnColor = turn === 'w' ? 'white' : 'black';
  const isMyTurn = currentTurnColor === myColor;
  const opponentColor = myColor === 'white' ? 'black' : 'white';

  const topPlayer = players[opponentColor];
  const bottomPlayer = players[myColor];

  return (
    <div className="game-page">
      <header className="game-header">
        <div className="game-header-left">
          <span className="brand-icon-sm">♛</span>
          <span className="brand-name-sm">ChessLive</span>
        </div>
        <div className="room-badge">Room: <strong>{roomId}</strong></div>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => dispatch({ type: 'LEAVE_GAME' })}
        >
          ← Leave
        </button>
      </header>

      <StatusBanner gameState={gameState} myColor={myColor} />

      <div className="game-layout">
        <div className="board-column">
          <PlayerBar
            player={topPlayer}
            color={opponentColor}
            isMyTurn={!isMyTurn}
            gameState={gameState}
            isTop
          />

          <ChessBoardView
            fen={gameState.fen}
            myColor={myColor}
            isMyTurn={isMyTurn}
            gameActive={status === 'active'}
            onMove={handleMove}
            boardWidth={boardWidth}
          />

          <PlayerBar
            player={bottomPlayer}
            color={myColor}
            isMyTurn={isMyTurn}
            gameState={gameState}
          />

          <div className="game-controls">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowResignConfirm(true)}
              disabled={status !== 'active'}
            >
              🏳 Resign
            </button>
          </div>
        </div>

        <div className="side-panel">
          <CapturedPieces capturedPieces={capturedPieces} players={players} />
          <MoveHistory moves={moveHistory} />
        </div>
      </div>

      {showResignConfirm && (
        <div className="modal-overlay" onClick={() => setShowResignConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Resign Game?</h3>
            <p>Are you sure you want to resign? This will end the game.</p>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => { resign(); setShowResignConfirm(false); }}
              >
                Yes, Resign
              </button>
              <button className="btn btn-outline" onClick={() => setShowResignConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'finished' && <GameOverModal />}
    </div>
  );
}
