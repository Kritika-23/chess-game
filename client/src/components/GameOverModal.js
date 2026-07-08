/**
 * GameOverModal — shown when game ends, offers rematch/leave
 */
import React from 'react';
import { useGame } from '../context/GameContext';
import { useChessSocketActions } from '../hooks/useChessSocket';

export default function GameOverModal({ onClose }) {
  const { state, dispatch } = useGame();
  const { requestRestart, acceptRestart, declineRestart } = useChessSocketActions();
  const { gameState, myColor, restartPending } = state;

  if (!gameState?.result) return null;
  const { winner, reason } = gameState.result;
  const isDraw = winner === null;
  const iWon = winner === myColor;

  return (
    <div className="modal-overlay">
      <div className="game-over-modal">
        <div className={`game-over-icon ${isDraw ? 'draw' : iWon ? 'win' : 'lose'}`}>
          {isDraw ? '🤝' : iWon ? '🏆' : '♟'}
        </div>
        <h2 className="game-over-title">
          {isDraw ? "It's a Draw" : iWon ? 'You Won!' : 'You Lost'}
        </h2>
        <p className="game-over-reason">
          {reason === 'checkmate' && 'By checkmate'}
          {reason === 'stalemate' && 'By stalemate'}
          {reason === 'draw' && 'Draw by repetition or insufficient material'}
          {reason === 'resignation' && (iWon ? 'Opponent resigned' : 'You resigned')}
          {reason === 'timeout' && 'On time'}
        </p>

        {restartPending === 'incoming' ? (
          <div className="rematch-prompt">
            <p>Opponent wants a rematch!</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={acceptRestart}>Accept</button>
              <button className="btn btn-outline" onClick={declineRestart}>Decline</button>
            </div>
          </div>
        ) : restartPending === 'outgoing' ? (
          <div className="rematch-prompt">
            <p>Waiting for opponent to accept...</p>
            <div className="spinner" />
          </div>
        ) : (
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={requestRestart}>
              ↻ Request Rematch
            </button>
            <button
              className="btn btn-outline"
              onClick={() => dispatch({ type: 'LEAVE_GAME' })}
            >
              Leave Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
