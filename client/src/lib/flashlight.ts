let torchStream: MediaStream | null = null;
let torchTrack: MediaStreamTrack | null = null;

export async function enableFlashlight() {
  try {
    console.log("💡 Enabling flashlight...");
    
    // First, show the screen flash immediately (works on all devices)
    flashScreen(true);
    
    // Then try to enable device torch if available
    try {
      const constraints = {
        video: {
          facingMode: "environment",
        },
      } as any;

      torchStream = await navigator.mediaDevices.getUserMedia(constraints);
      torchTrack = torchStream.getVideoTracks()[0];

      if (torchTrack) {
        // Try to enable torch on device
        await (torchTrack as any).applyConstraints({
          advanced: [{ torch: true }],
        });
        console.log("✅ Device flashlight (torch) enabled");
      }
    } catch (torchError) {
      console.log("ℹ️ Device torch not available, using screen flash");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Flashlight error:", error);
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
      
      // Create intense white flash - maximum brightness
      flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #ffffff;
        opacity: 1;
        z-index: 99999;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Add white background behind everything
      flashElement.innerHTML = '<div style="width: 100%; height: 100%; background: white;"></div>';
      document.body.appendChild(flashElement);
      
      console.log("💡 Screen flash activated (white overlay)");

      // Create and inject intense pulsing animation
      let styleElement = document.getElementById("flash-pulse-style");
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "flash-pulse-style";
        styleElement.textContent = `
          @keyframes emergency-flash {
            0%, 100% { opacity: 1 !important; }
            50% { opacity: 0.3 !important; }
          }
        `;
        document.head.appendChild(styleElement);
      }

      // Apply intense pulsing animation
      flashElement.style.animation = "emergency-flash 0.3s infinite";
    }
  } else {
    if (flashElement) {
      console.log("💡 Screen flash deactivated");
      flashElement.remove();
    }
  }
}
