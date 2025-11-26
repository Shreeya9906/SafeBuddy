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

    // Create repeating siren pattern - REAL LOUD EMERGENCY SIREN (Ambulance/Fire Truck)
    const sirenPattern = () => {
      if (!isPlaying || !audioContext) return;

      const now = audioContext.currentTime;

      // Real emergency siren with deep, powerful tones
      // First wailing cycle - LOW to HIGH sweep (deep bass + mid)
      createSirenTone(now, now + 0.4, 400);      // Very deep bass
      createSirenTone(now, now + 0.4, 550);      // Deep mid tone
      createSirenTone(now + 0.1, now + 0.4, 700); // Rising mid tone
      
      // Second wailing cycle - HIGH to LOW sweep
      createSirenTone(now + 0.4, now + 0.8, 800); // High frequency
      createSirenTone(now + 0.4, now + 0.8, 600); // Mid frequency
      createSirenTone(now + 0.5, now + 0.8, 400); // Dropping to bass
      
      // Third wailing cycle - DEEP BASS PULSE
      createSirenTone(now + 0.8, now + 1.2, 350); // Very deep bass pulse
      createSirenTone(now + 0.8, now + 1.2, 480); // Supporting mid
      createSirenTone(now + 0.9, now + 1.2, 650); // Rising tone
      
      // Fourth wailing cycle - FINAL POWERFUL SURGE
      createSirenTone(now + 1.2, now + 1.6, 750); // Loud mid-high
      createSirenTone(now + 1.2, now + 1.6, 500); // Strong bass support
      createSirenTone(now + 1.2, now + 1.6, 1000); // Top frequency for brightness
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

    osc.type = "square"; // Square wave is much harsher and louder than sine
    osc.frequency.setValueAtTime(frequency, startTime);
    osc.frequency.linearRampToValueAtTime(frequency, endTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(1.0, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(1.0, endTime - 0.01);
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
