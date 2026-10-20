import React, { useEffect, useRef, useState } from 'react';
import { playEagleSound } from '../utils/audio';

interface IntroAnimationProps {
  onComplete: () => void;
}

/**
 * Smooth intro animation using direct inline style manipulation (useRef).
 *
 * WHY: CSS class-switching between `animation` and `transition` causes the
 * browser to "teleport" the element because the animation fill-mode state
 * is not seen as the transition start value. Driving transforms via inline
 * styles with explicit reflows guarantees smooth, continuous motion.
 *
 * Morph target math:
 *   Intro image max-height:   200px  (natural render size)
 *   Login logo max-height:    90px
 *   Scale factor:             90 / 200 = 0.45
 *   Login logo center Y from screen center:
 *     card padding-top = 44px, logo half-height = 45px → 89px from card top
 *     card estimated height ≈ 640px → half = 320px
 *     logo from screen center = 89 - 320 = -231px
 *   Final transform: translateY(-231px) scale(0.45)
 */
export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef    = useRef<HTMLDivElement>(null);
  const imageRef     = useRef<HTMLImageElement>(null);
  const soundPlayed  = useRef(false);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    const screen = screenRef.current;
    if (!el || !screen) return;

    // ── INITIAL STATE (instant, no transition) ────────────────────────────
    el.style.transition = 'none';
    el.style.transform  = 'translateY(80vh) scale(0.35)';
    el.style.opacity    = '0.2';
    el.style.filter     = 'drop-shadow(0 15px 35px rgba(0,0,0,0.6)) drop-shadow(0 0 25px rgba(255,111,89,0.45))';

    // Force reflow so initial state is committed before any transition starts
    void el.offsetHeight;

    // ── STAGE 1: RISE (0 → 1200ms) ───────────────────────────────────────
    // Logo rises from bottom and zooms to large center
    el.style.transition = [
      'transform 1.2s cubic-bezier(0.18, 0.89, 0.32, 1.15)',
      'opacity   1.0s ease',
      'filter    1.0s ease',
    ].join(', ');
    el.style.transform = 'translateY(0) scale(1.4)';
    el.style.opacity   = '1';

    // ── STAGE 2: SCREECH (1200ms) ─────────────────────────────────────────
    // Play eagle sound + vibrate image + burst ring (image vibration doesn't
    // touch container transform so no teleport)
    const t1 = setTimeout(() => {
      if (!soundPlayed.current) {
        soundPlayed.current = true;
        playEagleSound();
      }
      setShowBurst(true);
      if (imageRef.current) {
        imageRef.current.classList.add('vibrating');
      }
      // Hold — no container transform change during screech
    }, 1200);

    // ── STAGE 3: MORPH (2200ms) ───────────────────────────────────────────
    // Logo smoothly glides to exact login card logo position.
    // Starting from scale(1.4) at center → ending at translateY(-231px) scale(0.45)
    // This is a single uninterrupted CSS transition from the CURRENT inline state.
    const t2 = setTimeout(() => {
      setShowBurst(false);
      if (imageRef.current) {
        imageRef.current.classList.remove('vibrating');
      }

      el.style.transition = [
        'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
        'opacity   1.1s ease',
        'filter    1.1s ease',
      ].join(', ');
      el.style.transform = 'translateY(-231px) scale(0.45)';
      el.style.filter    = 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))';
    }, 2200);

    // ── STAGE 4: DONE (3500ms) ────────────────────────────────────────────
    // Fade the logo out, then fade the overlay — logo stays at morph position
    // so the login card logo appears exactly where the intro logo was.
    const t3 = setTimeout(() => {
      // Fade out the intro logo (stays at morph position)
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity    = '0';

      // Fade out the dark overlay simultaneously
      screen.style.transition = 'opacity 0.7s ease, visibility 0.7s ease';
      screen.style.opacity    = '0';
      screen.style.visibility = 'hidden';

      setTimeout(onComplete, 700);
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div ref={screenRef} className="intro-animation-screen">
      {/* Coral atmospheric glow */}
      <div className="intro-radial-glow" />

      {/* Logo container — transforms set by JS above, no class switching */}
      <div ref={containerRef} className="intro-logo-container">
        <img
          ref={imageRef}
          src={`${import.meta.env.BASE_URL}images/Logo.png`}
          alt="Falcon Logo"
          className="intro-logo-image"
        />
        {showBurst && <div className="intro-screech-burst" />}
      </div>
    </div>
  );
};
