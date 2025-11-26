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

    // Create repeating siren pattern - CLASSIC EUROPEAN AMBULANCE WAIL (NICE & EFFECTIVE)
    const sirenPattern = () => {
      if (!isPlaying || !audioContext) return;

      const now = audioContext.currentTime;

      // Classic two-tone ambulance siren - alternates between high and low frequencies
      // Cycle 1: Low to High wail (0.6s)
      createWailingSirenTone(now, now + 0.6, 600, 1000);
      
      // Cycle 2: High to Low wail (0.6s)
      createWailingSirenTone(now + 0.6, now + 1.2, 1000, 600);
    };

    // Play siren immediately
    sirenPattern();

    // Repeat continuously every 1.2 seconds
    const interval = setInterval(() => {
      if (isPlaying) {
        sirenPattern();
        // Gentle vibration pattern
        if ('vibrate' in navigator) {
          navigator.vibrate([150, 50, 150]);
        }
      }
    }, 1200);

    sirenIntervals.push(interval);

    // Initial vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([150, 50, 150]);
    }
  } catch (error) {
    console.error("Error playing siren:", error);
  }
}

function createWailingSirenTone(startTime: number, endTime: number, startFreq: number, endFreq: number) {
  if (!audioContext) return;

  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine"; // Smooth sine wave for pleasant siren sound
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.linearRampToValueAtTime(endFreq, endTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.7, endTime - 0.05);
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
