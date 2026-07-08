import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";

function getInitials(user) {
  const source = user?.name || user?.username || user?.email || "Player";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

export default function Navbar({
  currentPage,
  setCurrentPage,
  toggleTheme,
  logout,
  user,
  onLogin,
  onSignUp,
  soundEnabled,
  toggleSound,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const goHome = () => {
    setCurrentPage("home");
    setProfileOpen(false);
  };

  const goProfile = () => {
    setCurrentPage("profile");
    setProfileOpen(false);
  };

  return (
    <header className="site-header">
      <button className="site-brand" onClick={goHome} aria-label="ChessLive home">
        <span className="site-logo">♛</span>
        <span className="site-name">ChessLive</span>
      </button>

      <nav className="site-nav" aria-label="Primary navigation">
        {user && (
          <button
            className={currentPage === "home" ? "nav-link active" : "nav-link"}
            onClick={goHome}
          >
            Home
          </button>
        )}
      </nav>

      <div className="site-actions">
        <button className="icon-action" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
          ◐
        </button>

        <button
          className={soundEnabled ? "icon-action" : "icon-action icon-action-muted"}
          onClick={toggleSound}
          title={soundEnabled ? "Disable sound effects" : "Enable sound effects"}
          aria-label={soundEnabled ? "Disable sound effects" : "Enable sound effects"}
        >
          {soundEnabled ? "♪" : "×"}
        </button>

        {!user ? (
          <div className="public-auth-actions">
            <button className="btn btn-outline btn-sm" onClick={onLogin}>Login</button>
            <button className="btn btn-primary btn-sm" onClick={onSignUp}>Sign Up</button>
          </div>
        ) : (
          <div className="profile-menu" ref={menuRef}>
            <button
              className="profile-trigger"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                <span>{getInitials(user)}</span>
              )}
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-user">
                  <strong>{user.name || user.username || "Player"}</strong>
                  <span>{user.email}</span>
                </div>
                <button onClick={goProfile}>My Profile</button>
                <button className="dropdown-danger" onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
