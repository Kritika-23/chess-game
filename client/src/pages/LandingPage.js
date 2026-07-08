/**
 * LandingPage - create or join an online game room, or start local computer play.
 */
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useChessSocketActions } from '../hooks/useChessSocket';
import { apiFetch, readJsonResponse } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LandingPage({ onPlayComputer }) {
  const { state, dispatch, notify } = useGame();
  const { joinRoom } = useChessSocketActions();

  const prefillRoom = sessionStorage.getItem('prefillRoom') || '';
  const [playerName, setPlayerName] = useState(state.playerName || '');
  const [joinCode, setJoinCode] = useState(prefillRoom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(prefillRoom ? 'join' : 'create');

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Enter your name first');
      notify('warn', 'Enter your name first', 3000);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await readJsonResponse(await apiFetch('/api/rooms', { method: 'POST' }));
      dispatch({ type: 'SET_PLAYER_NAME', payload: playerName.trim() });
      notify('success', 'Room created', 3000);
      joinRoom(data.roomId, playerName.trim());
    } catch (e) {
      const message = 'Failed to create game. Is the server running?';
      setError(message);
      notify('error', message, 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError('Enter your name first');
      notify('warn', 'Enter your name first', 3000);
      return;
    }
    if (!joinCode.trim()) {
      setError('Enter a room code');
      notify('warn', 'Enter a room code', 3000);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = joinCode.trim().toUpperCase();
      const data = await readJsonResponse(await apiFetch(`/api/rooms/${code}`));
      if (data.playerCount >= 2) {
        setError('Room is full');
        notify('warn', 'Room is full', 3500);
        setLoading(false);
        return;
      }
      dispatch({ type: 'SET_PLAYER_NAME', payload: playerName.trim() });
      joinRoom(code, playerName.trim());
    } catch (e) {
      const message = e?.message?.includes('404') ? 'Invalid room code' : 'Failed to join game.';
      setError(message);
      notify('error', message, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-board-decoration">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className={`hero-cell ${(Math.floor(i / 8) + i) % 2 === 0 ? 'light' : 'dark'}`}
            />
          ))}
        </div>
        <div className="landing-content">
          <div className="brand">
            <div className="brand-icon">♛</div>
            <h1 className="brand-name">Chess<span>Live</span></h1>
            <p className="brand-tagline">Real-time multiplayer chess</p>
          </div>

          <div className="landing-card">
            <div className="tab-bar">
              <button
                className={`tab-btn ${tab === 'create' ? 'active' : ''}`}
                onClick={() => { setTab('create'); setError(''); }}
              >
                Create Game
              </button>
              <button
                className={`tab-btn ${tab === 'join' ? 'active' : ''}`}
                onClick={() => { setTab('join'); setError(''); }}
              >
                Join Game
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreateGame() : handleJoinGame())}
                maxLength={20}
                autoFocus
              />
            </div>

            {tab === 'join' && (
              <div className="form-group">
                <label className="form-label">Room Code</label>
                <input
                  className="form-input room-code-input"
                  type="text"
                  placeholder="XXXXXXXX"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoinGame()}
                  maxLength={8}
                />
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="home-action-stack">
              {tab === 'create' ? (
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleCreateGame}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner label="" inline size="sm" /> : 'Create Game'}
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-full"
                  onClick={handleJoinGame}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner label="" inline size="sm" /> : 'Join Game'}
                </button>
              )}

              <button
                className="btn btn-outline btn-full"
                onClick={onPlayComputer}
                disabled={loading}
              >
                Play with Computer 🤖
              </button>
            </div>
          </div>

          <div className="features">
            <div className="feature-item"><span>⚡</span> Real-time moves</div>
            <div className="feature-item"><span>⏱</span> 10 min timer</div>
            <div className="feature-item"><span>♟</span> All chess rules</div>
            <div className="feature-item"><span>🤖</span> Computer practice</div>
          </div>
        </div>
      </div>
    </div>
  );
}
