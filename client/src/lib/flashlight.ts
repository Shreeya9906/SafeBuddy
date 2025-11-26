let torchStream: MediaStream | null = null;
let torchTrack: MediaStreamTrack | null = null;

export async function enableFlashlight() {
  try {
    // Get the camera stream with torch
    const constraints = {
      video: {
        facingMode: "environment",
      },
    } as any;

    torchStream = await navigator.mediaDevices.getUserMedia(constraints);
    torchTrack = torchStream.getVideoTracks()[0];

    if (!torchTrack) {
      throw new Error("No video track found");
    }

    // Try to enable torch
    const settings = torchTrack.getSettings();
    if ("torch" in settings) {
      await (torchTrack as any).applyConstraints({
        advanced: [{ torch: true }],
      });
      return true;
    } else {
      // Fallback: Flash the screen using HTML5 Canvas
      flashScreen(true);
      return true;
    }
  } catch (error) {
    console.error("Flashlight error:", error);
    // Fallback to screen flash
    flashScreen(true);
    return true;
  }
}

export async function disableFlashlight() {
  try {
    if (torchTrack) {
      await (torchTrack as any).applyConstraints({
        advanced: [{ torch: false }],
      });
    }

    if (torchStream) {
      torchStream.getTracks().forEach((track) => track.stop());
    }

    torchStream = null;
    torchTrack = null;
    flashScreen(false);
  } catch (error) {
    console.error("Error disabling flashlight:", error);
    flashScreen(false);
  }
}

function flashScreen(enable: boolean) {
  let flashElement = document.getElementById("screen-flash");

  if (enable) {
    if (!flashElement) {
      flashElement = document.createElement("div");
      flashElement.id = "screen-flash";
      flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: white;
        opacity: 0.8;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(flashElement);

      // Pulse effect
      const keyframes = `
        @keyframes flash-pulse {
          0% { opacity: 0.8; }
          50% { opacity: 0.6; }
          100% { opacity: 0.8; }
        }
      `;
      const style = document.createElement("style");
      style.textContent = keyframes;
      document.head.appendChild(style);

      flashElement.style.animation = "flash-pulse 0.5s infinite";
    }
  } else {
    if (flashElement) {
      flashElement.remove();
    }
  }
}
