import React from 'react';

export default function PublicHome({ onLogin, onSignUp, onPlayComputer }) {
  return (
    <main className="public-home">
      <section className="public-hero">
        <div className="hero-board-decoration public-board">
          {Array.from({ length: 64 }).map((_, index) => (
            <div
              key={index}
              className={`hero-cell ${(Math.floor(index / 8) + index) % 2 === 0 ? 'light' : 'dark'}`}
            />
          ))}
        </div>

        <div className="public-hero-content">
          <p className="public-kicker">Real-time multiplayer chess</p>
          <h1 className="public-title">ChessLive</h1>
          <p className="public-copy">
            Create private rooms, invite opponents, track your profile, and play clean live chess from any screen.
          </p>

          <div className="public-actions">
            <button className="btn btn-primary" onClick={onSignUp}>Sign Up</button>
            <button className="btn btn-outline" onClick={onLogin}>Login</button>
            <button className="btn btn-secondary" onClick={onPlayComputer}>Play with Computer 🤖</button>
          </div>
          <p className="public-auth-note">Login is required before starting any game mode.</p>

          <div className="public-stats">
            <div>
              <strong>10 min</strong>
              <span>Rapid rooms</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Socket play</span>
            </div>
            <div>
              <strong>1200</strong>
              <span>Starter rating</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
