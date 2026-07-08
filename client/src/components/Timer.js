/**
 * Timer — displays time remaining for a player
 */
import React from 'react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Timer({ seconds, isActive, color }) {
  const isLow = seconds <= 30;
  const isEmpty = seconds <= 0;

  return (
    <div className={`timer ${isActive ? 'timer-active' : ''} ${isLow ? 'timer-low' : ''} ${isEmpty ? 'timer-empty' : ''}`}>
      <div className="timer-label">{color === 'white' ? '♙' : '♟'}</div>
      <div className="timer-display">{formatTime(seconds)}</div>
    </div>
  );
}
