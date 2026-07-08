/**
 * PromotionDialog — modal for choosing pawn promotion piece
 */
import React from 'react';

const PIECES = [
  { code: 'q', name: 'Queen' },
  { code: 'r', name: 'Rook' },
  { code: 'b', name: 'Bishop' },
  { code: 'n', name: 'Knight' },
];

const UNICODE = {
  white: { q: '♕', r: '♖', b: '♗', n: '♘' },
  black: { q: '♛', r: '♜', b: '♝', n: '♞' },
};

export default function PromotionDialog({ color, onSelect, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="promotion-title">Promote Pawn</h3>
        <div className="promotion-options">
          {PIECES.map(p => (
            <button
              key={p.code}
              className="promotion-btn"
              onClick={() => onSelect(p.code)}
            >
              <span className="promotion-piece">{UNICODE[color][p.code]}</span>
              <span className="promotion-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
