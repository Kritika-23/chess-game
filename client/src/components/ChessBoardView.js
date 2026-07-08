/**
 * ChessBoardView — wraps react-chessboard, handles drag-and-drop, legal-move
 * highlighting, and promotion flow.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import PromotionDialog from './PromotionDialog';

export default function ChessBoardView({ fen, myColor, isMyTurn, gameActive, onMove, boardWidth }) {
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }
  const [moveFrom, setMoveFrom] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});

  // Build a read-only Chess instance from the current FEN to compute legal moves client-side
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const isPromotionMove = (from, to) => {
    const piece = chess.get(from);
    if (!piece || piece.type !== 'p') return false;
    const targetRank = to[1];
    return (piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1');
  };

  const highlightMoves = useCallback((square) => {
    const moves = chess.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const squares = {};
    moves.forEach(m => {
      squares[m.to] = {
        background: chess.get(m.to)
          ? 'radial-gradient(circle, rgba(224, 104, 91, 0.22) 58%, rgba(224, 104, 91, 0.9) 60%, rgba(15, 20, 21, 0.88) 66%, transparent 68%)'
          : 'radial-gradient(circle, rgba(15, 20, 21, 0.92) 16%, rgba(227, 201, 138, 0.95) 18%, rgba(227, 201, 138, 0.95) 27%, transparent 29%)',
        borderRadius: '50%',
        boxShadow: 'inset 0 0 0 2px rgba(15, 20, 21, 0.24)',
      };
    });
    squares[square] = {
      background: 'rgba(227, 201, 138, 0.34)',
      boxShadow: 'inset 0 0 0 4px rgba(15, 20, 21, 0.55)',
    };
    setOptionSquares(squares);
    return true;
  }, [chess]);

  function attemptMove(from, to) {
    if (!gameActive || !isMyTurn) return false;

    // Verify the piece belongs to this player
    const piece = chess.get(from);
    if (!piece) return false;
    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== myColor) return false;

    // Check legality client-side first (UX only — server re-validates)
    const legalMoves = chess.moves({ square: from, verbose: true });
    const match = legalMoves.find(m => m.to === to);
    if (!match) return false;

    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
      return true;
    }

    onMove(from, to, null);
    setMoveFrom(null);
    setOptionSquares({});
    return true;
  }

  // Drag-and-drop handler
  function onDrop(sourceSquare, targetSquare) {
    const ok = attemptMove(sourceSquare, targetSquare);
    setMoveFrom(null);
    setOptionSquares({});
    return ok;
  }

  // Click-to-move (mobile-friendly alternative to drag)
  function onSquareClick(square) {
    if (!gameActive || !isMyTurn) return;

    if (moveFrom) {
      if (square === moveFrom) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
      const moved = attemptMove(moveFrom, square);
      if (!moved) {
        // Maybe clicked a new piece of their own
        const piece = chess.get(square);
        if (piece && (piece.color === 'w' ? 'white' : 'black') === myColor) {
          setMoveFrom(square);
          highlightMoves(square);
        } else {
          setMoveFrom(null);
          setOptionSquares({});
        }
      }
    } else {
      const piece = chess.get(square);
      if (piece && (piece.color === 'w' ? 'white' : 'black') === myColor) {
        setMoveFrom(square);
        highlightMoves(square);
      }
    }
  }

  function handlePromotionSelect(pieceCode) {
    if (!pendingPromotion) return;
    onMove(pendingPromotion.from, pendingPromotion.to, pieceCode);
    setPendingPromotion(null);
    setMoveFrom(null);
    setOptionSquares({});
  }

  return (
    <div className="board-wrapper">
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        boardOrientation={myColor || 'white'}
        boardWidth={boardWidth}
        customSquareStyles={optionSquares}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#769656' }}
        customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
        animationDuration={200}
        arePiecesDraggable={gameActive && isMyTurn}
      />
      {pendingPromotion && (
        <PromotionDialog
          color={myColor}
          onSelect={handlePromotionSelect}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
}
