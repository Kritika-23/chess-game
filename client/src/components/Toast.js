import React from 'react';
import { useGame } from '../context/GameContext';

export default function Toast() {
  const { state, dispatch } = useGame();
  const notifications = state.notifications?.length
    ? state.notifications
    : state.notification
      ? [state.notification]
      : [];

  if (!notifications.length) return null;

  const icons = { success: '✓', error: '✕', warn: '!', info: 'i' };

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <div key={notification.id} className={`toast toast-${notification.type}`}>
          <span className="toast-icon">{icons[notification.type] || 'i'}</span>
          <span className="toast-message">{notification.message}</span>
          <button
            className="toast-close"
            onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION', payload: notification.id })}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
