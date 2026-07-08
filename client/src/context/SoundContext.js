import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import moveSound from '../assets/sounds/move.wav';
import captureSound from '../assets/sounds/capture.wav';
import checkSound from '../assets/sounds/check.wav';
import checkmateSound from '../assets/sounds/checkmate.wav';
import gameOverSound from '../assets/sounds/gameOver.wav';
import gameStartSound from '../assets/sounds/gameStart.wav';
import illegalSound from '../assets/sounds/illegal.wav';
import buttonSound from '../assets/sounds/button.wav';

const SoundContext = createContext(null);

const SOUND_FILES = {
  move: moveSound,
  capture: captureSound,
  check: checkSound,
  checkmate: checkmateSound,
  gameOver: gameOverSound,
  gameStart: gameStartSound,
  illegal: illegalSound,
  button: buttonSound,
};

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('chesslive:sound') !== 'off');
  const audioRefs = useRef({});

  useEffect(() => {
    audioRefs.current = Object.entries(SOUND_FILES).reduce((sounds, [name, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      sounds[name] = audio;
      return sounds;
    }, {});
  }, []);

  useEffect(() => {
    localStorage.setItem('chesslive:sound', soundEnabled ? 'on' : 'off');
  }, [soundEnabled]);

  const playSound = useCallback((name) => {
    if (!soundEnabled) return;

    const audio = audioRefs.current[name];
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browsers may block playback until the user interacts with the page.
    });
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((enabled) => !enabled);
  }, []);

  const value = useMemo(() => ({
    soundEnabled,
    playSound,
    toggleSound,
  }), [playSound, soundEnabled, toggleSound]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  return useContext(SoundContext);
}
