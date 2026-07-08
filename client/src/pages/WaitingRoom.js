/**
 * WaitingRoom — shown while waiting for opponent to join
 */
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function WaitingRoom() {
  const { state, dispatch } = useGame();
  const { roomId, playerName, myColor } = state;
  const [copied, setCopied] = useState(false);

  const gameUrl = `${window.location.origin}?room=${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(gameUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <div className="waiting-icon">
          <div className="waiting-piece">{myColor === 'white' ? '♙' : '♟'}</div>
          <div className="waiting-pulse" />
        </div>

        <h2 className="waiting-title">Waiting for Opponent</h2>
        <p className="waiting-subtitle">
          You are playing as <strong>{myColor === 'white' ? '♙ White' : '♟ Black'}</strong>
        </p>
        <p className="waiting-name">Hello, <strong>{playerName}</strong>!</p>

        <div className="room-share">
          <p className="share-label">Share this room code with your opponent:</p>
          <div className="room-code-display">
            <span className="room-code-text">{roomId}</span>
            <button className="btn btn-sm btn-outline" onClick={copyCode}>
              {copied ? '✓ Copied' : 'Copy Code'}
            </button>
          </div>

          <p className="share-label share-label-or">— or share the link —</p>
          <div className="share-link-row">
            <input
              className="form-input share-link-input"
              type="text"
              value={gameUrl}
              readOnly
            />
            <button className="btn btn-sm btn-primary" onClick={copyLink}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        <div className="waiting-dots">
          <span /><span /><span />
        </div>

        <div className="waiting-skeleton" aria-hidden="true">
          <span />
          <span />
        </div>

        <button
          className="btn btn-outline btn-sm leave-btn"
          onClick={() => dispatch({ type: 'LEAVE_GAME' })}
        >
          ← Leave Room
        </button>
      </div>
    </div>
  );
}
