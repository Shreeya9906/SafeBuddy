let audioContext: AudioContext | null = null;
let oscillators: OscillatorNode[] = [];
let gains: GainNode[] = [];
let masterGain: GainNode | null = null;
let isPlaying = false;
let sirenIntervals: NodeJS.Timeout[] = [];

export function playSOSSiren() {
  if (isPlaying) return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    isPlaying = true;

    // Create master gain at maximum volume
    if (!masterGain) {
      masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(1.0, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
    }

    // VERY LOUD Emergency Siren Pattern - Multiple frequencies simultaneously
    const createSiren = () => {
      if (!isPlaying || !audioContext) return;
      
      const now = audioContext.currentTime;
      
      // Frequency sweep: 600Hz to 1200Hz and back for maximum loudness
      createOscillatorTone(now, now + 0.5, 600, 1200);
      createOscillatorTone(now, now + 0.5, 800, 1000);
      createOscillatorTone(now, now + 0.5, 1000, 900);
      
      // Reverse sweep: 1200Hz to 600Hz
      createOscillatorTone(now + 0.5, now + 1.0, 1200, 600);
      createOscillatorTone(now + 0.5, now + 1.0, 1000, 800);
      createOscillatorTone(now + 0.5, now + 1.0, 900, 1000);
    };

    createSiren();

    // Repeat every 1 second - NO GAPS
    const interval = setInterval(() => {
      if (isPlaying) {
        createSiren();
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }, 1000);

    sirenIntervals.push(interval);

    // Intense vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  } catch (error) {
    console.error("Error playing siren:", error);
    isPlaying = false;
  }
}

function createOscillatorTone(startTime: number, endTime: number, startFreq: number, endFreq: number) {
  if (!audioContext || !masterGain) return;

  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // Use sine wave for smooth sound propagation
    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.linearRampToValueAtTime(endFreq, endTime);

    // MAXIMUM VOLUME - 0.8 per oscillator, 3 oscillators = very loud
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.8, startTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.8, endTime - 0.05);
    gain.gain.linearRampToValueAtTime(0, endTime);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(endTime);

    oscillators.push(osc);
    gains.push(gain);
  } catch (e) {
    console.error("Error creating tone:", e);
  }
}

export function stopSOSSiren() {
  isPlaying = false;
  
  // Clear intervals
  sirenIntervals.forEach(interval => clearInterval(interval));
  sirenIntervals = [];
  
  // Stop all oscillators
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
  masterGain = null;
}
