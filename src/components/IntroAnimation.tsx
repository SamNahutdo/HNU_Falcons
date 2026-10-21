import React, { useEffect, useRef, useState } from 'react';
import { preloadEagleSound, playEagleSound, unlockEagleSound } from '../utils/audio';

interface IntroAnimationProps {
  onComplete: () => void;
}

/**
 * Intro animation waits for a user gesture so browser audio can be unlocked.
 *
 * WHY CLICK REQUIRED: Edge/Chrome block ALL audio until a user gesture.
 * This is a hard browser security rule with no code workaround.
 * The user activates the logo to start the animation and audio playback.
 */
export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const containerRef  = useRef<HTMLButtonElement>(null);
  const screenRef     = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'idle' | 'zoom-in' | 'zoom-out' | 'sound' | 'morph' | 'finish'>('idle');

  useEffect(() => {
    preloadEagleSound();
  }, []);

  useEffect(() => {
    if (phase === 'zoom-in') {
      const timer = window.setTimeout(() => setPhase('zoom-out'), 400);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'zoom-out') {
      const timer = window.setTimeout(() => {
        void playEagleSound({
          onLevel: (level) => {
            screenRef.current?.style.setProperty('--audio-level', level.toFixed(3));
          }
        });
        setPhase('sound');
      }, 250);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'sound') {
      const timer = window.setTimeout(() => setPhase('morph'), 450);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'morph') {
      const logo = containerRef.current;
      const loginLogo = document.querySelector<HTMLImageElement>('.login-logo-wrap img');
      const screen = screenRef.current;
      if (!logo || !loginLogo || !screen) return;

      const logoBounds = logo.getBoundingClientRect();
      const targetBounds = loginLogo.getBoundingClientRect();
      const x = targetBounds.left + targetBounds.width / 2 - (logoBounds.left + logoBounds.width / 2);
      const y = targetBounds.top + targetBounds.height / 2 - (logoBounds.top + logoBounds.height / 2);
      const scale = targetBounds.width / logo.offsetWidth;
      logo.style.transition = 'transform 450ms cubic-bezier(0.2, 0.75, 0.25, 1), opacity 450ms ease';
      logo.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      screen.classList.add('is-morphing');

      const timer = window.setTimeout(() => {
        setPhase('finish');
        screen.style.transition = 'opacity 250ms ease, visibility 250ms ease';
        screen.style.opacity = '0';
        screen.style.visibility = 'hidden';
        window.setTimeout(onComplete, 250);
      }, 500);

      return () => window.clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Resume audio in the user gesture, then play after the zoom-in/out sequence.
  const handleStart = () => {
    if (phase !== 'idle') return;
    unlockEagleSound();
    setPhase('zoom-in');
  };

  return (
    <div
      ref={screenRef}
      className={`intro-animation-screen ${phase !== 'idle' ? 'is-active' : ''} ${phase === 'morph' ? 'is-morphing' : phase !== 'idle' ? `is-${phase}` : ''}`}
    >
      <button
        type="button"
        ref={containerRef}
        className="intro-logo-container"
        onClick={handleStart}
        aria-label="Play Falcon intro"
        disabled={phase !== 'idle'}
      >
        <span className="intro-circle-overlay" aria-hidden="true">
          <span className="intro-circle intro-circle-outer" />
          <span className="intro-circle intro-circle-middle" />
          <span className="intro-circle intro-circle-inner" />
          <span className="intro-circle intro-circle-core" />
          {phase === 'sound' && (
            <>
              <span className="intro-ripple intro-ripple-green" />
              <span className="intro-ripple intro-ripple-yellow" />
              <span className="intro-ripple intro-ripple-blue" />
            </>
          )}
        </span>
        <img
          src={`${import.meta.env.BASE_URL}images/Logo.png`}
          alt=""
          className="intro-logo-image"
        />
      </button>
    </div>
  );
};
