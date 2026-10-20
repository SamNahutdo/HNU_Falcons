// Falcon / Eagle Sound Synthesizer via Web Audio API
// Generates an authentic, piercing raptor screech reliably without external assets

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playEagleSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master gain for the screech
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.4, now + 0.08);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.35);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
    masterGain.connect(ctx.destination);

    // Primary raptor screech oscillator
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2900, now);
    osc1.frequency.exponentialRampToValueAtTime(3250, now + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.95);
    osc1.frequency.exponentialRampToValueAtTime(950, now + 1.25);

    // LFO for raptor vocal vibrato / trill
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(42, now); // 42Hz raptor throat vibrato
    lfoGain.gain.setValueAtTime(180, now);
    lfoGain.gain.linearRampToValueAtTime(80, now + 0.8);
    lfo.connect(osc1.frequency);

    // Harmonic layer (screech overtone)
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(5800, now);
    osc2.frequency.exponentialRampToValueAtTime(2900, now + 0.95);
    osc2Gain.gain.setValueAtTime(0.12, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    // Resonant bandpass filter to give that authentic bird-of-prey cry resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3100, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.95);
    filter.Q.setValueAtTime(6.5, now);

    // Raspy breath noise component
    const bufferSize = ctx.sampleRate * 1.3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
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

    // Connections
    osc1.connect(filter);
    filter.connect(masterGain);

    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    // Secondary echo screech (distant hawk call)
    const echoTime = now + 0.75;
    const oscEcho = ctx.createOscillator();
    const echoGain = ctx.createGain();
    oscEcho.type = 'sawtooth';
    oscEcho.frequency.setValueAtTime(2600, echoTime);
    oscEcho.frequency.exponentialRampToValueAtTime(1200, echoTime + 0.55);

    echoGain.gain.setValueAtTime(0.001, echoTime);
    echoGain.gain.linearRampToValueAtTime(0.18, echoTime + 0.05);
    echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.55);

    oscEcho.connect(filter);
    echoGain.connect(masterGain);

    // Start all nodes
    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    noise.start(now);

    oscEcho.start(echoTime);

    // Stop all nodes
    lfo.stop(now + 1.35);
    osc1.stop(now + 1.35);
    osc2.stop(now + 1.35);
    noise.stop(now + 1.35);
    oscEcho.stop(echoTime + 0.6);
  } catch (err) {
    console.warn('Audio synthesis note:', err);
  }
}
