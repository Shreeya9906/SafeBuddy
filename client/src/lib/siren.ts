let audioContext: AudioContext | null = null;
let oscillators: OscillatorNode[] = [];
let gains: GainNode[] = [];
let isPlaying = false;
let sirenIntervals: NodeJS.Timeout[] = [];

export function playSOSSiren() {
  if (isPlaying) return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume audio context if suspended (required by browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    isPlaying = true;

    // Create repeating siren pattern every 3 seconds
    const sirenPattern = () => {
      if (!isPlaying || !audioContext) return;

      const now = audioContext.currentTime;

      // Siren pattern: alternating high and low tones
      createSirenTone(now, now + 0.4, 1000); // High beep
      createSirenTone(now + 0.5, now + 0.9, 600); // Low beep
      createSirenTone(now + 1.0, now + 1.4, 1000); // High beep
      createSirenTone(now + 1.5, now + 1.9, 600); // Low beep
      createSirenTone(now + 2.0, now + 2.5, 800); // Medium tone
    };

    // Play siren immediately
    sirenPattern();

    // Repeat every 3 seconds
    const interval = setInterval(() => {
      if (isPlaying) {
        sirenPattern();
      }
    }, 3000);

    sirenIntervals.push(interval);

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

  try {
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
  } catch (e) {
    console.error("Error creating siren tone:", e);
  }
}

export function stopSOSSiren() {
  isPlaying = false;
  
  // Clear all intervals
  sirenIntervals.forEach(interval => clearInterval(interval));
  sirenIntervals = [];
  
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
