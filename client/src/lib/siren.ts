let audioElement: HTMLAudioElement | null = null;
let isPlaying = false;

export function playSOSSiren() {
  if (isPlaying) return;
  
  try {
    isPlaying = true;

    // Create or reuse audio element
    if (!audioElement) {
      audioElement = new Audio('/siren.mp3');
      audioElement.volume = 1.0; // Maximum volume
    }

    // Reset and play
    audioElement.currentTime = 0;
    audioElement.loop = true; // Loop continuously
    audioElement.play().catch((error) => {
      console.error("Error playing siren audio:", error);
      isPlaying = false;
    });

    // Vibration pattern
    if ('vibrate' in navigator) {
      navigator.vibrate([150, 50, 150, 50, 150]);
    }
  } catch (error) {
    console.error("Error playing siren:", error);
    isPlaying = false;
  }
}

export function stopSOSSiren() {
  isPlaying = false;
  
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  // Stop vibration
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

export function cleanupAudioContext() {
  stopSOSSiren();
  if (audioElement) {
    audioElement = null;
  }
}
