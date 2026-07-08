/**
 * CapturedPieces — shows pieces captured by each player
 */
import React from 'react';

const PIECE_UNICODE = {
  p: { white: '♙', black: '♟' },
  r: { white: '♖', black: '♜' },
  n: { white: '♘', black: '♞' },
  b: { white: '♗', black: '♝' },
  q: { white: '♕', black: '♛' },
  k: { white: '♔', black: '♚' },
};

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function PieceGroup({ pieces, capturedBy }) {
  // capturedBy = 'white' means white took these (they're black pieces)
  const displayColor = capturedBy === 'white' ? 'black' : 'white';
  const sorted = [...pieces].sort((a, b) => PIECE_VALUE[b] - PIECE_VALUE[a]);
  const total = pieces.reduce((acc, p) => acc + (PIECE_VALUE[p] || 0), 0);

  return (
    <div className="captured-group">
      <div className="captured-pieces-row">
        {sorted.length === 0 ? (
          <span className="captured-empty">—</span>
        ) : (
          sorted.map((p, i) => (
            <span key={i} className="captured-piece">
              {PIECE_UNICODE[p]?.[displayColor] || p}
            </span>
          ))
        )}
      </div>
      {total > 0 && <span className="captured-score">+{total}</span>}
    </div>
  );
}

export default function CapturedPieces({ capturedPieces, players }) {
  return (
    <div className="captured-section">
      <div className="panel-title">Captured</div>
      <div className="captured-row">
        <span className="captured-label">♙</span>
        <PieceGroup pieces={capturedPieces.white || []} capturedBy="white" />
      </div>
      <div className="captured-row">
        <span className="captured-label">♟</span>
        <PieceGroup pieces={capturedPieces.black || []} capturedBy="black" />
      </div>
    </div>
  );
}
