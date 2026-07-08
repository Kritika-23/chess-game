import { useCallback, useEffect, useRef, useState } from 'react';

const DIFFICULTY_CONFIG = {
  beginner: { skill: 0, depth: 2, moveTime: 250 },
  easy: { skill: 4, depth: 4, moveTime: 450 },
  medium: { skill: 8, depth: 7, moveTime: 800 },
  hard: { skill: 14, depth: 10, moveTime: 1200 },
  expert: { skill: 20, depth: 14, moveTime: 1800 },
};

function parseWorkerMessage(event) {
  const value = event?.data ?? event;
  return typeof value === 'string' ? value : String(value || '');
}

export function useStockfish(difficulty = 'medium') {
  const workerRef = useRef(null);
  const pendingResolveRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lastInfo, setLastInfo] = useState('');

  useEffect(() => {
    const worker = new Worker(new URL('../workers/stockfish.worker.js', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = parseWorkerMessage(event);
      setLastInfo(message);

      if (message === 'uciok' || message === 'readyok') {
        setReady(true);
      }

      if (message.startsWith('bestmove')) {
        setThinking(false);
        const [, bestMove] = message.split(/\s+/);
        pendingResolveRef.current?.(bestMove && bestMove !== '(none)' ? bestMove : null);
        pendingResolveRef.current = null;
      }
    };

    worker.postMessage('uci');
    worker.postMessage('isready');

    return () => {
      pendingResolveRef.current?.(null);
      pendingResolveRef.current = null;
      worker.postMessage('quit');
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
    worker.postMessage(`setoption name Skill Level value ${config.skill}`);
    worker.postMessage('ucinewgame');
    worker.postMessage('isready');
  }, [difficulty]);

  const findBestMove = useCallback((fen) => {
    const worker = workerRef.current;
    if (!worker || pendingResolveRef.current) {
      return Promise.resolve(null);
    }

    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
    setThinking(true);

    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${config.depth} movetime ${config.moveTime}`);
    });
  }, [difficulty]);

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop');
    setThinking(false);
  }, []);

  return { ready, thinking, lastInfo, findBestMove, stop };
}

export { DIFFICULTY_CONFIG };
