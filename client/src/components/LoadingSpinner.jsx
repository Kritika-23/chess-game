import React from 'react';

export default function LoadingSpinner({ label = 'Loading', fullScreen = false, inline = false, size = 'md' }) {
  const className = [
    'loading-spinner',
    fullScreen ? 'loading-spinner-full' : '',
    inline ? 'loading-spinner-inline' : '',
    `loading-spinner-${size}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={className} role="status" aria-live="polite">
      <span className="spinner" />
      {label && <span>{label}</span>}
    </div>
  );
}
