/**
 * StatusBanner — check/checkmate/stalemate/turn status display
 */
import React from 'react';

export default function StatusBanner({ gameState, myColor }) {
  if (!gameState) return null;

  const { status, turn, inCheck, isCheckmate, isStalemate, isDraw, result } = gameState;

  if (status === 'waiting') {
    return (
      <div className="status-banner status-waiting">
        ⏳ Waiting for opponent...
      </div>
    );
  }

  if (status === 'finished') {
    if (!result) return null;
    const { winner, reason } = result;
    const iWon = winner === myColor;
    const isDraw = winner === null;

    return (
      <div className={`status-banner ${isDraw ? 'status-draw' : iWon ? 'status-win' : 'status-lose'}`}>
        {isDraw && `Draw by ${reason}!`}
        {!isDraw && iWon && `🏆 You won by ${reason}!`}
        {!isDraw && !iWon && `You lost by ${reason}.`}
      </div>
    );
  }

  const currentColor = turn === 'w' ? 'white' : 'black';
  const isMyTurn = currentColor === myColor;

  if (inCheck && isMyTurn) {
    return <div className="status-banner status-check">⚠️ You are in check!</div>;
  }
  if (inCheck && !isMyTurn) {
    return <div className="status-banner status-check-opp">♟ Opponent is in check</div>;
  }
  if (isMyTurn) {
    return <div className="status-banner status-your-turn">Your turn to move</div>;
  }
  return <div className="status-banner status-waiting-move">Waiting for opponent's move...</div>;
}
