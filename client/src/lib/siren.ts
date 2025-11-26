let audioContext: AudioContext | null = null;
let oscillators: OscillatorNode[] = [];
let gains: GainNode[] = [];
let isPlaying = false;

export function playSOSSiren() {
  if (isPlaying) return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    isPlaying = true;
    const now = audioContext.currentTime;
    const duration = 3; // 3 seconds per cycle
    const cycles = 99; // Play for ~5 minutes (99 cycles of 3 seconds)

    for (let cycle = 0; cycle < cycles; cycle++) {
      const cycleStart = now + cycle * duration;

      // Siren pattern: high frequency, then low frequency
      createSirenTone(cycleStart, cycleStart + 0.5, 1000); // High beep
      createSirenTone(cycleStart + 0.5, cycleStart + 1.0, 600); // Low beep
      createSirenTone(cycleStart + 1.0, cycleStart + 1.5, 1000); // High beep
      createSirenTone(cycleStart + 1.5, cycleStart + 2.0, 600); // Low beep
      createSirenTone(cycleStart + 2.0, cycleStart + 3.0, 800); // Medium tone
    }

    // Vibrate phone if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  } catch (error) {
    console.error("Error playing siren:", error);
  }
}

function createSirenTone(startTime: number, endTime: number, frequency: number) {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.frequency.exponentialRampToValueAtTime(frequency * 1.2, startTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.8, endTime - 0.1);
  osc.frequency.setValueAtTime(frequency, endTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
  gain.gain.linearRampToValueAtTime(0.3, endTime - 0.05);
  gain.gain.linearRampToValueAtTime(0, endTime);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(startTime);
  osc.stop(endTime);

  oscillators.push(osc);
  gains.push(gain);
}

export function stopSOSSiren() {
  isPlaying = false;
  
  // Stop all active oscillators
  oscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // Already stopped
    }
  });
  
  oscillators = [];
  gains = [];

  // Stop vibration
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

export function cleanupAudioContext() {
  stopSOSSiren();
  if (audioContext && audioContext.state === "running") {
    audioContext.close().catch(() => {
      // Already closed
    });
  }
  audioContext = null;
}
