export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS not supported. Please use a mobile device or enable location in browser settings."));
      return;
    }

    console.log("📍 Requesting high-accuracy GPS from your phone...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy || 0;
        console.log(`✅ GPS location received: ${position.coords.latitude}, ${position.coords.longitude} (accuracy: ±${accuracy.toFixed(0)}m)`);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
        });
      },
      (error) => {
        let errorMsg = error.message;
        if (error.code === 1) {
          errorMsg = "Location permission denied. Please enable GPS in your phone settings and grant permission to this app.";
        } else if (error.code === 2) {
          errorMsg = "Location service unavailable. Please enable GPS/Location Services on your phone.";
        } else if (error.code === 3) {
          errorMsg = "Location request timed out. Please move to an area with better GPS signal.";
        }
        console.error(`❌ GPS Error: ${errorMsg}`);
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,  // Request GPS (not just IP-based)
        timeout: 15000,            // Wait 15 seconds for GPS
        maximumAge: 0,             // Don't use cached location
      }
    );
  });
}

export function watchLocation(callback: (location: LocationData) => void): number {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
      });
    },
    (error) => {
      console.error("Location watch error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

export function clearLocationWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

export function getBatteryLevel(): Promise<number> {
  if ('getBattery' in navigator) {
    return (navigator as any).getBattery().then((battery: any) => {
      return Math.round(battery.level * 100);
    });
  }
  return Promise.resolve(100);
}
