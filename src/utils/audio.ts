// Eagle / Falcon Intro Sound
// Uses Web Audio API (fetch → decodeAudioData → BufferSourceNode) for
// reliable, zero-delay playback. HTMLAudioElement autoplay is often blocked;
// AudioContext.resume() + decodeAudioData is significantly more permissive.

let audioCtx: AudioContext | null = null;
let audioBufferPromise: Promise<AudioBuffer | null> | null = null;

export interface EagleSoundCallbacks {
  onStart?: () => void;
  onLevel?: (level: number) => void;
  onEnded?: () => void;
}

// ─── AudioContext helper ──────────────────────────────────────────────────────
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

// ─── Fetch & decode the audio file ───────────────────────────────────────────
async function loadAudioBuffer(): Promise<AudioBuffer | null> {
  try {
    const url = `${import.meta.env.BASE_URL}images/eagle.mp3`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Eagle audio fetch failed: HTTP ${response.status} — ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    return decoded;
  } catch (err) {
    console.warn('Eagle audio decode failed:', err);
    return null;
  }
}

// ─── Preload (call on component mount) ───────────────────────────────────────
// Kicks off the fetch+decode immediately so the buffer is ready by the time
// playEagleSound() fires. Second call is a no-op.
export function preloadEagleSound(): void {
  if (audioBufferPromise) return;
  audioBufferPromise = loadAudioBuffer();
}

export function unlockEagleSound(): void {
  const ctx = getAudioContext();
  void ctx.resume().catch((err) => {
    console.warn('Eagle audio context could not resume:', err);
  });
}

// ─── Play ─────────────────────────────────────────────────────────────────────
// Awaits the preloaded buffer then plays instantly with no network delay.
// Falls back to a synthesized screech if the file couldn't be loaded.
export async function playEagleSound(callbacks: EagleSoundCallbacks = {}): Promise<void> {
  // Ensure AudioContext is running (may be suspended on first load)
  const ctx = getAudioContext();
  try {
    await ctx.resume();
  } catch (err) {
    console.warn('Eagle audio context could not resume:', err);
  }

  // Wait for preloaded buffer (should already be resolved by 1200ms)
  const buffer = audioBufferPromise ? await audioBufferPromise : null;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.72;
  analyser.connect(ctx.destination);

  if (buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    const stopMeter = watchAudioLevel(analyser, callbacks);
    source.onended = () => {
      stopMeter();
      callbacks.onLevel?.(0);
      callbacks.onEnded?.();
    };
    source.start(0);
    callbacks.onStart?.();
  } else {
    // File not available — use synthesized screech
    playSynthesizedEagleSound(ctx, analyser, callbacks);
  }
}

function watchAudioLevel(
  analyser: AnalyserNode,
  callbacks: EagleSoundCallbacks
): () => void {
  const samples = new Uint8Array(analyser.fftSize);
  let frameId = 0;
  const updateLevel = () => {
    analyser.getByteTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, sample) => {
      const amplitude = (sample - 128) / 128;
      return sum + amplitude * amplitude;
    }, 0) / samples.length);
    callbacks.onLevel?.(Math.min(1, rms * 4.5));
    frameId = requestAnimationFrame(updateLevel);
  };

  updateLevel();
  return () => cancelAnimationFrame(frameId);
}

// ─── Synthesized fallback ─────────────────────────────────────────────────────
function playSynthesizedEagleSound(
  ctx: AudioContext,
  analyser: AnalyserNode,
  callbacks: EagleSoundCallbacks
): void {
  try {
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.4, now + 0.08);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.35);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
    masterGain.connect(analyser);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2900, now);
    osc1.frequency.exponentialRampToValueAtTime(3250, now + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.95);
    osc1.frequency.exponentialRampToValueAtTime(950, now + 1.25);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(42, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(180, now);
    lfoGain.gain.linearRampToValueAtTime(80, now + 0.8);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(5800, now);
    osc2.frequency.exponentialRampToValueAtTime(2900, now + 0.95);
    osc2Gain.gain.setValueAtTime(0.12, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3100, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.95);
    filter.Q.setValueAtTime(6.5, now);

    const bufferSize = ctx.sampleRate * 1.3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1500, now + 0.95);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc1.connect(filter); filter.connect(masterGain);
    osc2.connect(osc2Gain); osc2Gain.connect(masterGain);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain);

    const echoTime = now + 0.75;
    const oscEcho = ctx.createOscillator();
    const echoGain = ctx.createGain();
    oscEcho.type = 'sawtooth';
    oscEcho.frequency.setValueAtTime(2600, echoTime);
    oscEcho.frequency.exponentialRampToValueAtTime(1200, echoTime + 0.55);
    echoGain.gain.setValueAtTime(0.001, echoTime);
    echoGain.gain.linearRampToValueAtTime(0.18, echoTime + 0.05);
    echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.55);
    oscEcho.connect(filter); echoGain.connect(masterGain);

    lfo.start(now); osc1.start(now); osc2.start(now); noise.start(now);
    oscEcho.start(echoTime);
    lfo.stop(now + 1.35); osc1.stop(now + 1.35); osc2.stop(now + 1.35);
    noise.stop(now + 1.35); oscEcho.stop(echoTime + 0.6);
    const stopMeter = watchAudioLevel(analyser, callbacks);
    oscEcho.onended = () => {
      stopMeter();
      callbacks.onLevel?.(0);
      callbacks.onEnded?.();
    };
    callbacks.onStart?.();
  } catch (err) {
    console.warn('Synthesized audio error:', err);
    callbacks.onEnded?.();
  }
}
