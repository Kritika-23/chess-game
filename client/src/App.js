import React, { useEffect, useState } from "react";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { GameProvider, useGame } from "./context/GameContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SoundProvider, useSound } from "./context/SoundContext";
import { useChessSocketListeners } from "./hooks/useChessSocket";

import AuthPage from "./pages/AuthPage";
import PublicHome from "./pages/PublicHome";
import LandingPage from "./pages/LandingPage";
import WaitingRoom from "./pages/WaitingRoom";
import GamePage from "./pages/GamePage";
import ProfilePage from "./pages/ProfilePage";
import ComputerGamePage from "./pages/ComputerGamePage";

import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import SkeletonLoader from "./components/SkeletonLoader";

import "./styles/App.css";

function AppShell() {
  const { state } = useGame();
  const { user, loading, logout } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const socket = useSocket();

  const [theme, setTheme] = useState("dark");
  const [currentPage, setCurrentPage] = useState("home");
  const [authMode, setAuthMode] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [pendingPage, setPendingPage] = useState(null);

  useChessSocketListeners();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.disconnect();
    socket.connect();
  }, [socket, user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    if (user) {
      setCurrentPage(pendingPage || "home");
      setAuthMode(null);
      setAuthToken("");
      setPendingPage(null);
    }
  }, [user, pendingPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";
    const path = window.location.pathname;

    if (!token) return;

    if (path === "/verify-email") {
      setAuthMode("verify");
      setAuthToken(token);
    } else if (path === "/reset-password") {
      setAuthMode("reset");
      setAuthToken(token);
    } else {
      return;
    }

    window.history.replaceState({}, document.title, "/");
  }, []);

  const showLogin = () => setAuthMode("login");
  const showSignUp = () => setAuthMode("register");
  const goPublicHome = () => setAuthMode(null);
  const requireLoginForComputer = () => {
    setPendingPage("computer");
    setAuthMode("login");
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage("home");
    setAuthMode(null);
  };

  // Loading screen
  if (loading) {
    return <SkeletonLoader variant="home" />;
  }

  if (!user) {
    return (
      <div className="app-root">
        <Navbar
          currentPage="home"
          setCurrentPage={goPublicHome}
          toggleTheme={toggleTheme}
          onLogin={showLogin}
          onSignUp={showSignUp}
          user={null}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
        />

        {authMode ? (
          <AuthPage
            initialMode={authMode}
            initialToken={authToken}
            onAuthSuccess={() => {
              setCurrentPage(pendingPage || "home");
              setPendingPage(null);
              setAuthMode(null);
              setAuthToken("");
            }}
          />
        ) : (
          <PublicHome
            onLogin={showLogin}
            onSignUp={showSignUp}
            onPlayComputer={requireLoginForComputer}
          />
        )}
      </div>
    );
  }

  // Chess pages
  let content;

  if (state.phase === "lobby") {
    content = <LandingPage onPlayComputer={() => setCurrentPage("computer")} />;
  } else if (state.phase === "waiting") {
    content = <WaitingRoom />;
  } else {
    content = <GamePage />;
  }

  return (
    <div className="app-root">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        toggleTheme={toggleTheme}
        logout={handleLogout}
        user={user}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
      />

      {currentPage === "profile" && <ProfilePage />}
      {currentPage === "computer" && user && <ComputerGamePage onReturnHome={() => setCurrentPage("home")} />}
      {currentPage === "home" && content}

      <Toast />
    </div>
  );
}

function AutoJoinFromUrl() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");

    if (room) {
      sessionStorage.setItem("prefillRoom", room.toUpperCase());
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <SoundProvider>
            <AutoJoinFromUrl />
            <AppShell />
          </SoundProvider>
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
