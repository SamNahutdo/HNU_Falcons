import React, { useEffect, useRef, useState } from 'react';
import { preloadEagleSound, playEagleSound, unlockEagleSound } from '../utils/audio';

interface IntroAnimationProps {
  onComplete: () => void;
}

/**
 * Intro animation waits for a user tap so browser audio can be unlocked.
 *
 * WHY CLICK REQUIRED: Edge/Chrome block ALL audio until a user gesture.
 * This is a hard browser security rule with no code workaround.
 * The user taps to start the animation and unlock audio playback.
 */
export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const containerRef  = useRef<HTMLDivElement>(null);
  const screenRef     = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    preloadEagleSound();
    if (!hasStarted) return;

    const el     = containerRef.current;
    const screen = screenRef.current;
    if (!el || !screen) return;

    // ── INITIAL STATE ─────────────────────────────────────────────────────
    el.style.transition = 'none';
    el.style.transform  = 'translateY(80vh) scale(0.35)';
    el.style.opacity    = '0.2';
    void el.offsetHeight;

    // ── STAGE 1: RISE (0 → 1200ms) ───────────────────────────────────────
    el.style.transition = [
      'transform 1.2s cubic-bezier(0.18, 0.89, 0.32, 1.15)',
      'opacity   1.0s ease',
    ].join(', ');
    el.style.transform = 'translateY(0) scale(1.4)';
    el.style.opacity   = '1';

    // ── STAGE 2: SCREECH ─────────────────────────────────────────────────
    const t1 = setTimeout(() => {
      void playEagleSound();
    }, 1000);

    // ── STAGE 3: MORPH (2200ms) ───────────────────────────────────────────
    const t2 = setTimeout(() => {
      el.style.transition = [
        'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
        'opacity   1.1s ease',
      ].join(', ');
      el.style.transform = 'translateY(-231px) scale(0.45)';
    }, 2200);

    // ── STAGE 4: DONE (3500ms) ────────────────────────────────────────────
    const t3 = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity    = '0';
      screen.style.transition = 'opacity 0.7s ease, visibility 0.7s ease';
      screen.style.opacity    = '0';
      screen.style.visibility = 'hidden';
      setTimeout(onComplete, 200);
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hasStarted, onComplete]);

  // Tapping starts the animation and resumes audio from within the user gesture.
  const handleScreenClick = () => {
    if (hasStarted) return;
    unlockEagleSound();
    setHasStarted(true);
  };

  return (
    <div
      ref={screenRef}
      className="intro-animation-screen"
      onClick={handleScreenClick}
      style={{ cursor: hasStarted ? 'default' : 'pointer' }}
    >
      <div ref={containerRef} className="intro-logo-container">
        <img
          src={`${import.meta.env.BASE_URL}images/Logo.png`}
          alt="Falcon Logo"
          className="intro-logo-image"
        />
      </div>
      {!hasStarted && (
        <button
          type="button"
          className="intro-tap-prompt"
          onClick={(event) => {
            event.stopPropagation();
            handleScreenClick();
          }}
        >
          Tap to continue
        </button>
      )}
    </div>
  );
};
