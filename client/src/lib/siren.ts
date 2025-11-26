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

    // Create repeating siren pattern - MAXIMUM VOLUME two-tone police siren for 1+ km distance
    const sirenPattern = () => {
      if (!isPlaying || !audioContext) return;

      const now = audioContext.currentTime;

      // Classic "Wee-Woo" police siren - layered for maximum loudness
      // High tone cycle - 1200 Hz
      createSirenTone(now, now + 0.5, 1200);
      createSirenTone(now, now + 0.5, 2400); // Harmonic overlay for more volume
      
      // Low tone cycle - 900 Hz
      createSirenTone(now + 0.5, now + 1.0, 900);
      createSirenTone(now + 0.5, now + 1.0, 1800); // Harmonic overlay for more volume
      
      // High tone cycle - 1200 Hz
      createSirenTone(now + 1.0, now + 1.5, 1200);
      createSirenTone(now + 1.0, now + 1.5, 2400); // Harmonic overlay
      
      // Low tone cycle - 900 Hz
      createSirenTone(now + 1.5, now + 2.0, 900);
      createSirenTone(now + 1.5, now + 2.0, 1800); // Harmonic overlay
    };

    // Play siren immediately
    sirenPattern();

    // Repeat continuously every 2 seconds - NO GAPS for maximum penetration distance
    const interval = setInterval(() => {
      if (isPlaying) {
        sirenPattern();
        // MAXIMUM vibration intensity every siren cycle
        if ('vibrate' in navigator) {
          navigator.vibrate([300, 100, 300, 100, 300, 100, 300, 100, 300]);
        }
      }
    }, 2000);

    sirenIntervals.push(interval);

    // Intense vibration pattern for long-distance alerting
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
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
    gain.gain.linearRampToValueAtTime(1.0, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(1.0, endTime - 0.02);
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

function createWailingSirenTone(startTime: number, endTime: number, startFreq: number, endFreq: number) {
  if (!audioContext) return;

  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "triangle"; // Using triangle wave for more emergency siren feel
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.linearRampToValueAtTime(endFreq, endTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.85, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.85, endTime - 0.02);
    gain.gain.linearRampToValueAtTime(0, endTime);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(startTime);
    osc.stop(endTime);

    oscillators.push(osc);
    gains.push(gain);
  } catch (e) {
    console.error("Error creating wailing siren tone:", e);
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
