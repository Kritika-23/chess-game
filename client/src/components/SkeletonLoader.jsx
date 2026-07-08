import React from 'react';

function Line({ width = '100%', height = 12, className = '' }) {
  return <span className={`skeleton-line ${className}`} style={{ width, height }} />;
}

export default function SkeletonLoader({ variant = 'home' }) {
  if (variant === 'profile') {
    return (
      <main className="profile-page">
        <section className="profile-shell skeleton-fade">
          <div className="profile-hero-card skeleton-card">
            <span className="skeleton-avatar" />
            <div className="skeleton-stack">
              <Line width="32%" />
              <Line width="58%" height={32} />
              <Line width="42%" />
              <Line width="72%" />
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-panel skeleton-panel">
              <Line width="34%" height={22} />
              <Line />
              <Line width="88%" />
              <Line width="94%" />
              <Line width="76%" />
            </div>
            <div className="profile-panel skeleton-panel">
              <Line width="42%" height={22} />
              <div className="skeleton-stat-grid">
                {Array.from({ length: 5 }).map((_, index) => <span key={index} className="skeleton-stat" />)}
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (variant === 'board') {
    return (
      <main className="game-page skeleton-fade">
        <div className="game-header">
          <Line width={150} />
          <Line width={110} />
        </div>
        <div className="game-layout">
          <div className="board-column skeleton-board-column">
            <Line width="100%" height={58} />
            <div className="skeleton-board">
              {Array.from({ length: 64 }).map((_, index) => <span key={index} />)}
            </div>
            <Line width="100%" height={58} />
          </div>
          <div className="side-panel">
            <div className="skeleton-panel"><Line width="55%" /><Line /><Line width="80%" /></div>
            <div className="skeleton-panel"><Line width="45%" /><Line /><Line /><Line width="72%" /></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="landing-page skeleton-fade">
      <section className="landing-card skeleton-home-card">
        <Line width="42%" height={26} />
        <Line width="100%" height={44} />
        <Line width="100%" height={44} />
        <Line width="100%" height={48} />
      </section>
    </main>
  );
}
