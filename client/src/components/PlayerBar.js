/**
 * PlayerBar — shows player name, color, and connection status
 */
import React from 'react';
import Timer from './Timer';

export default function PlayerBar({ player, color, isMyTurn, gameState, isTop }) {
  const isActive = gameState?.status === 'active' && isMyTurn;
  const seconds = gameState?.timers?.[color] ?? 600;

  return (
    <div className={`player-bar ${isMyTurn && gameState?.status === 'active' ? 'player-bar-active' : ''} ${isTop ? 'player-bar-top' : 'player-bar-bottom'}`}>
      <div className="player-info">
        <div className={`player-avatar ${color}`}>
          {color === 'white' ? '♙' : '♟'}
        </div>
        <div className="player-details">
          <div className="player-name">
            {player?.name || 'Waiting...'}
            {!player?.connected && player && (
              <span className="disconnected-badge">⚠ disconnected</span>
            )}
          </div>
          <div className="player-color-label">
            {color === 'white' ? 'White' : 'Black'}
            {isMyTurn && gameState?.status === 'active' && (
              <span className="turn-indicator"> • Your turn</span>
            )}
          </div>
        </div>
      </div>
      <Timer seconds={seconds} isActive={isActive} color={color} />
    </div>
  );
}
