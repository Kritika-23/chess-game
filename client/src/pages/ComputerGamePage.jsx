import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoardView from '../components/ChessBoardView';
import StatusBanner from '../components/StatusBanner';
import PlayerBar from '../components/PlayerBar';
import MoveHistory from '../components/MoveHistory';
import CapturedPieces from '../components/CapturedPieces';
import { useStockfish } from '../hooks/useStockfish';
import { useGame } from '../context/GameContext';
import { useSound } from '../context/SoundContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SIDE_OPTIONS = [
  { value: 'white', label: 'Play as White' },
  { value: 'black', label: 'Play as Black' },
  { value: 'random', label: 'Random Side' },
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

const ENGINE_MOVE_DELAY_MS = 2500;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGameStatus(chess, result) {
  if (result) return 'finished';
  return chess.isGameOver() ? 'finished' : 'active';
}

function getResult(chess, lastMoveColor) {
  if (!chess.isGameOver()) return null;
  if (chess.isCheckmate()) {
    return { winner: lastMoveColor, reason: 'checkmate' };
  }
  if (chess.isStalemate()) {
    return { winner: null, reason: 'stalemate' };
  }
  if (chess.isDraw()) {
    return { winner: null, reason: 'draw' };
  }
  return { winner: null, reason: 'game over' };
}

function getMoveColor(move) {
  return move.color === 'w' ? 'white' : 'black';
}

function toMoveHistory(move, index) {
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    captured: move.captured || null,
    flags: move.flags,
    fen: move.after,
    moveNumber: Math.ceil((index + 1) / 2),
  };
}

function buildCapturedPieces(history) {
  return history.reduce((captured, move) => {
    if (move.captured) {
      const capturedBy = getMoveColor(move);
      captured[capturedBy].push(move.captured);
    }
    return captured;
  }, { white: [], black: [] });
}

export default function ComputerGamePage({ onReturnHome }) {
  const { notify } = useGame();
  const { playSound } = useSound();
  const [setup, setSetup] = useState({ side: 'white', difficulty: 'medium' });
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');
  const [fen, setFen] = useState(new Chess().fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [boardWidth, setBoardWidth] = useState(500);
  const [enginePausing, setEnginePausing] = useState(false);
  const chessRef = useRef(new Chess());
  const engineMoveLockRef = useRef(false);
  const engineRequestIdRef = useRef(0);
  const { ready, thinking, findBestMove, stop } = useStockfish(setup.difficulty);

  const playMoveFeedback = useCallback((move, nextResult) => {
    if (nextResult) {
      playSound(nextResult.reason === 'checkmate' ? 'checkmate' : 'gameOver');
      return;
    }

    if (chessRef.current.inCheck()) {
      playSound('check');
    } else {
      playSound(move.captured ? 'capture' : 'move');
    }
  }, [playSound]);

  const notifyResult = useCallback((nextResult) => {
    if (!nextResult) return;

    if (!nextResult.winner) {
      notify('info', 'Game drawn', 5000);
      return;
    }

    if (nextResult.reason === 'checkmate') {
      notify('info', 'Checkmate!', 3500);
    }

    notify(
      nextResult.winner === playerColor ? 'success' : 'error',
      nextResult.winner === playerColor ? 'You won!' : 'You lost!',
      5000
    );
  }, [notify, playerColor]);

  useEffect(() => {
    function updateSize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw < 640) {
        setBoardWidth(Math.min(vw - 32, 420));
      } else if (vw < 1024) {
        setBoardWidth(Math.min(vw * 0.58, 500));
      } else {
        setBoardWidth(Math.min(vh * 0.68, 560));
      }
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const players = useMemo(() => ({
    white: {
      name: playerColor === 'white' ? 'You' : 'Stockfish',
      color: 'white',
      connected: true,
    },
    black: {
      name: playerColor === 'black' ? 'You' : 'Stockfish',
      color: 'black',
      connected: true,
    },
  }), [playerColor]);

  const gameState = useMemo(() => {
    const chess = chessRef.current;
    return {
      id: 'COMPUTER',
      fen,
      players,
      moveHistory,
      capturedPieces: buildCapturedPieces(moveHistory),
      status: getGameStatus(chess, result),
      result,
      timers: { white: 0, black: 0 },
      turn: chess.turn(),
      inCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
    };
  }, [fen, moveHistory, players, result]);

  const currentTurnColor = gameState.turn === 'w' ? 'white' : 'black';
  const computerColor = playerColor === 'white' ? 'black' : 'white';
  const computerIsThinking = thinking || enginePausing;
  const isPlayerTurn = gameStarted && !computerIsThinking && !result && currentTurnColor === playerColor;

  const syncFromChess = useCallback(() => {
    const history = chessRef.current.history({ verbose: true }).map(toMoveHistory);
    setMoveHistory(history);
    setFen(chessRef.current.fen());
  }, []);

  const applyEngineMove = useCallback(async () => {
    if (!gameStarted || result || thinking || engineMoveLockRef.current) return;
    if (currentTurnColor !== computerColor) return;

    engineMoveLockRef.current = true;
    const requestId = ++engineRequestIdRef.current;
    const bestMove = await findBestMove(chessRef.current.fen());

    if (requestId !== engineRequestIdRef.current || !bestMove || result) {
      engineMoveLockRef.current = false;
      return;
    }

    setEnginePausing(true);
    await wait(ENGINE_MOVE_DELAY_MS);
    setEnginePausing(false);

    if (requestId !== engineRequestIdRef.current || result) {
      engineMoveLockRef.current = false;
      return;
    }

    const move = chessRef.current.move({
      from: bestMove.slice(0, 2),
      to: bestMove.slice(2, 4),
      promotion: bestMove.slice(4, 5) || 'q',
    });

    engineMoveLockRef.current = false;

    if (!move) return;

    const nextResult = getResult(chessRef.current, getMoveColor(move));
    setResult(nextResult);
    playMoveFeedback(move, nextResult);
    notifyResult(nextResult);
    syncFromChess();
  }, [computerColor, currentTurnColor, findBestMove, gameStarted, notifyResult, playMoveFeedback, result, syncFromChess, thinking]);

  useEffect(() => {
    applyEngineMove();
  }, [applyEngineMove, fen]);

  const resetBoard = useCallback((color) => {
    stop();
    engineRequestIdRef.current += 1;
    engineMoveLockRef.current = false;
    setEnginePausing(false);
    chessRef.current = new Chess();
    setPlayerColor(color);
    setFen(chessRef.current.fen());
    setMoveHistory([]);
    setResult(null);
  }, [stop]);

  const startGame = () => {
    const color = setup.side === 'random'
      ? (Math.random() > 0.5 ? 'white' : 'black')
      : setup.side;
    resetBoard(color);
    setGameStarted(true);
    playSound('gameStart');
    notify('success', 'Game started', 3000);
  };

  const restartGame = () => {
    resetBoard(playerColor);
    setGameStarted(true);
    playSound('gameStart');
    notify('success', 'New game started', 3000);
  };

  const newGame = () => {
    resetBoard('white');
    setGameStarted(false);
  };

  const undoMove = () => {
    if (computerIsThinking) return;
    stop();
    setEnginePausing(false);
    chessRef.current.undo();
    chessRef.current.undo();
    setResult(null);
    syncFromChess();
  };

  const handlePlayerMove = (from, to, promotion) => {
    if (!isPlayerTurn) {
      playSound('illegal');
      notify('warn', computerIsThinking ? 'Stockfish is thinking.' : 'It is not your turn.', 2500);
      return;
    }

    const move = chessRef.current.move({ from, to, promotion: promotion || 'q' });
    if (!move) {
      playSound('illegal');
      notify('error', 'Invalid move', 3000);
      return;
    }

    const nextResult = getResult(chessRef.current, getMoveColor(move));
    setResult(nextResult);
    playMoveFeedback(move, nextResult);
    notifyResult(nextResult);
    syncFromChess();
  };

  if (!gameStarted) {
    return (
      <main className="computer-page computer-setup-page">
        <section className="computer-setup-card">
          <p className="public-kicker">Practice mode</p>
          <h1>Play with Computer</h1>
          <p className="computer-copy">Choose your side and difficulty. Stockfish runs in a Web Worker so the board stays responsive.</p>

          <div className="computer-option-group">
            <span>Side</span>
            <div className="computer-segmented">
              {SIDE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={setup.side === option.value ? 'active' : ''}
                  onClick={() => setSetup((current) => ({ ...current, side: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="computer-option-group">
            <span>Difficulty</span>
            <div className="computer-difficulty-grid">
              {DIFFICULTIES.map((option) => (
                <button
                  key={option.value}
                  className={setup.difficulty === option.value ? 'active' : ''}
                  onClick={() => setSetup((current) => ({ ...current, difficulty: option.value }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="computer-setup-actions">
            <button className="btn btn-primary" onClick={startGame} disabled={!ready}>
              {ready ? 'Start Game' : <LoadingSpinner label="Loading Stockfish" inline size="sm" />}
            </button>
            <button className="btn btn-outline" onClick={onReturnHome}>Return to Home</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="computer-page">
      <header className="game-header">
        <div className="game-header-left">
          <span className="brand-icon-sm">♛</span>
          <span className="brand-name-sm">ChessLive Computer</span>
        </div>
        <div className="room-badge">
          {setup.difficulty[0].toUpperCase() + setup.difficulty.slice(1)} · {computerIsThinking ? (
            <span className="thinking-label">
              Stockfish thinking
              <span className="thinking-dots" aria-hidden="true"><span /><span /><span /></span>
            </span>
          ) : isPlayerTurn ? 'Your move' : 'Ready'}
        </div>
        <button className="btn btn-sm btn-outline" onClick={onReturnHome}>Return Home</button>
      </header>

      <StatusBanner gameState={gameState} myColor={playerColor} />

      <div className="game-layout">
        <div className="board-column">
          <PlayerBar
            player={players[computerColor]}
            color={computerColor}
            isMyTurn={currentTurnColor === computerColor}
            gameState={gameState}
            isTop
          />

          <ChessBoardView
            fen={fen}
            myColor={playerColor}
            isMyTurn={isPlayerTurn}
            gameActive={gameState.status === 'active'}
            onMove={handlePlayerMove}
            boardWidth={boardWidth}
          />

          <PlayerBar
            player={players[playerColor]}
            color={playerColor}
            isMyTurn={isPlayerTurn}
            gameState={gameState}
          />

          <div className="game-controls computer-controls">
            <button className="btn btn-secondary btn-sm" onClick={restartGame}>Restart Game</button>
            <button className="btn btn-outline btn-sm" onClick={newGame}>New Game</button>
            <button className="btn btn-outline btn-sm" onClick={undoMove} disabled={computerIsThinking || moveHistory.length < 2}>Undo Move</button>
            <button className="btn btn-outline btn-sm" onClick={onReturnHome}>Return to Home</button>
          </div>
        </div>

        <div className="side-panel">
          <CapturedPieces capturedPieces={gameState.capturedPieces} players={players} />
          <MoveHistory moves={moveHistory} />
        </div>
      </div>
    </main>
  );
}
