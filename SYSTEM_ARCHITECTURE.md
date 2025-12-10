# System Architecture - Multilingual + Auto-SOS

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                              │
│  "i am chocking plz help" (with typos)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   AUTOCORRECT ENGINE          │
         │   (autocorrect.ts)            │
         │                               │
         │ 1. Split to words            │
         │ 2. Check against dictionary  │
         │ 3. Fuzzy match (Levenshtein) │
         │ 4. Detect emergency keywords │
         └────────────┬──────────────────┘
                      │
                      ▼
     "i am choking please help" + isEmergency: true
                      │
                      ▼
      ┌──────────────────────────────────┐
      │     MYBUDDY CHAT                 │
      │     (mybuddy.tsx)                │
      │                                  │
      │  - Show correction toast         │
      │  - Send corrected text to API    │
      │  - Get AI response               │
      └────────────┬─────────────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │ BACKEND ANALYSIS       │
        │ (/api/mybuddy/chat)    │
        │                        │
        │ Classify message type  │
        │ Generate response      │
        │ Set action flag        │
        └────────┬───────────────┘
                 │
     ┌───────────┴──────────────┬─────────────────┐
     │                          │                 │
     ▼                          ▼                 ▼
"sos_activated"       "contact_guardian"    "suggest_sos"
     │                          │                 │
     ▼                          ▼                 ▼
  AUTO-SOS                Alert Guardians     Manual Button
  WORKFLOW               (via MyBuddy)         (User choice)
     │
     ├─ Get Guardians from DB
     │
     ├─ Format Messages
     │  ├─ WhatsApp: Rich with maps link
     │  ├─ SMS: Plain text with coords
     │  └─ Call: Standard tel: protocol
     │
     ├─ Send Notifications (EMERGENCY-AUTOMATION.TS)
     │  ├─ WhatsApp Web: wa.me/{phone}?text=...
     │  ├─ SMS Native: sms:{phone}?body=...
     │  └─ Call Native: tel:{phone}
     │
     ├─ Create SOS Alert in DB
     │
     ├─ Start Location Polling (5-sec intervals)
     │  ├─ GET geolocation
     │  ├─ GET battery level
     │  └─ POST to /api/sos/{id}/locations
     │
     └─ Activate Siren + Flashlight
        ├─ playSOSSiren()
        └─ enableFlashlight()
```

---

## Module Architecture

### Module Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                    MYBUDDY PAGE                         │
│                 (mybuddy.tsx)                           │
│  - Orchestrates user interaction                        │
│  - Handles chat flow                                    │
│  - Manages SOS state                                    │
└──────────┬────────────────────┬──────────────┬──────────┘
           │                    │              │
    ┌──────▼──────┐    ┌────────▼────────┐   │
    │ Autocorrect │    │ Emergency Auto- │   │
    │ (new)       │    │ mation (new)    │   │
    │             │    │                 │   │
    │ - Process   │    │ - Format msgs   │   │
    │ - Fuzzy     │    │ - Send notifs   │   │
    │ - Detect    │    │ - Track locs    │   │
    └──────┬──────┘    └────────┬────────┘   │
           │                    │             │
           ▼                    ▼             ▼
    ┌──────────────────────────────────┐
    │  CORE DEPENDENCIES               │
    │                                  │
    │  - geolocation.ts                │
    │  - api.ts (sosAPI)               │
    │  - siren.ts                      │
    │  - flashlight.ts                 │
    │  - translations.ts (6 langs)     │
    │  - auth-context.ts               │
    │  - speech.ts (TTS/STT)           │
    └──────┬──────────────────────┬────┘
           │                      │
           ▼                      ▼
    ┌──────────────┐     ┌─────────────────┐
    │  BROWSER API │     │   BACKEND API   │
    │              │     │                 │
    │ - GPS        │     │ /api/sos/*      │
    │ - Battery    │     │ /api/mybuddy/*  │
    │ - Audio      │     │ /api/emergency/*│
    │ - Flashlight │     │ /api/track/*    │
    │ - SMS/Tel    │     │                 │
    └──────────────┘     └─────────────────┘
```

---

## Data Flow: SOS Activation

### Sequence Diagram

```
USER                MyBuddy              Backend              DB              Guardians
 │                    │                    │                 │                   │
 ├─ Type "help!" ────→│                    │                 │                   │
 │                    │                    │                 │                   │
 │                    ├─ Autocorrect ─────→│                 │                   │
 │                    │ "help"             │                 │                   │
 │                    │                    │                 │                   │
 │                    ├─ Send msg ─────────→│ Classify msg    │                   │
 │                    │                    │ Detect: URGENT  │                   │
 │                    │←─ Response ────────┤ action: SOS     │                   │
 │                    │ (sos_activated)    │                 │                   │
 │                    │                    │                 │                   │
 │◄─ Toast: "SOS!" ─┤                    │                 │                   │
 │                    │                    │                 │                   │
 │                    ├─ getGuardians() ───→│ Query users     │                   │
 │                    │                    │ Get guardians   │                   │
 │                    │←──────────────────────────────────────┤                   │
 │                    │ [Guardian1, Guardian2, Guardian3]     │                   │
 │                    │                    │                 │                   │
 │                    ├─ Format msgs       │                 │                   │
 │                    │ (WhatsApp+SMS+Call)│                 │                   │
 │                    │                    │                 │                   │
 │                    ├─ Send notifs ──────────────────────────────────────────→│
 │                    │ WhatsApp.web                         │                   │
 │                    │ SMS native                           │                   │
 │                    │ Tel native                           │                   │
 │                    │                    │                 │                   │
 │                    ├─ Create alert ─────→│ Insert row      │                   │
 │                    │                    │ Into sosAlerts   │                   │
 │                    │←───────────────────────────────────────┤                   │
 │                    │ sosId: "abc123"    │                 │                   │
 │                    │                    │                 │                   │
 │                    ├─ Start tracking    │                 │                   │
 │                    │ Every 5 seconds    │                 │                   │
 │                    │  ├─ getLocation()  │                 │                   │
 │                    │  ├─ POST location ─→│ Insert row      │                   │
 │                    │  │ to /locations    │ sosLocations    │                   │
 │                    │  │                  │                 │                   │
 │                    │  ├─ Wait 5 sec     │                 │                   │
 │                    │  └─ Repeat...      │                 │                   │
 │                    │                    │                 │                   │
 │◄─ Siren plays ────┤                    │                 │                   │
 │ Flashlight on     │                    │                 │                   │
 │                    │                    │                 │                   │
 │ ... 5 minutes     │                    │                 │                   │
 │ ... SOS active    │                    │                 │                   │
 │                    │                    │                 │                   │
 ├─ Click "Stop SOS"→│                    │                 │                   │
 │                    ├─ Stop tracking     │                 │                   │
 │                    ├─ Stop siren        │                 │                   │
 │                    ├─ Update alert ─────→│ Mark resolved   │                   │
 │                    │                    │                 │                   │
 │◄─ Toast: "SOS ────┤                    │                 │                   │
 │  stopped"         │                    │                 │                   │
```

---

## File Structure Overview

```
SafeBuddyGuardian/
├── client/src/
│   ├── lib/
│   │   ├── autocorrect.ts ────────────── ✨ NEW
│   │   │   ├── EMERGENCY_DICTIONARY
│   │   │   ├── COMMON_TYPOS
│   │   │   ├── levenshteinDistance()
│   │   │   ├── autocorrectMessage()
│   │   │   ├── detectEmergency()
│   │   │   └── processUserInput() ◀─── Main entry
│   │   │
│   │   ├── emergency-automation.ts ─────── ✨ NEW
│   │   │   ├── formatWhatsAppMessage()
│   │   │   ├── formatSMSMessage()
│   │   │   ├── sendWhatsAppMessage()
│   │   │   ├── sendSMS()
│   │   │   ├── initiatePhoneCall()
│   │   │   ├── sendAutomaticEmergencyNotifications()
│   │   │   ├── startContinuousLocationUpdates()
│   │   │   └── activateAutomaticSOS()
│   │   │
│   │   ├── translations.ts ───────────── 📝 MODIFIED
│   │   │   ├── en_IN: {...}
│   │   │   ├── hi_IN: {...}
│   │   │   ├── ta_IN: {...}
│   │   │   ├── te_IN: {...}
│   │   │   ├── kn_IN: {...} ◀─── NEW
│   │   │   ├── ml_IN: {...} ◀─── NEW
│   │   │   ├── getTranslation()
│   │   │   └── useTranslation()
│   │   │
│   │   ├── api.ts
│   │   │   └── sosAPI.addLocation() ◀─── Used by emergency-automation
│   │   │
│   │   ├── geolocation.ts
│   │   │   ├── getCurrentLocation()
│   │   │   └── getBatteryLevel()
│   │   │
│   │   ├── siren.ts
│   │   │   ├── playSOSSiren()
│   │   │   └── stopSOSSiren()
│   │   │
│   │   └── flashlight.ts
│   │       ├── enableFlashlight()
│   │       └── disableFlashlight()
│   │
│   └── pages/
│       └── mybuddy.tsx ──────────────── 📝 MODIFIED
│           ├── sendMessage() ◀─── Autocorrect integrated
│           │   ├── processUserInput() call
│           │   ├── Show correction toast
│           │   └── Send corrected text
│           │
│           ├── Handle sos_activated
│           │   ├── getGuardians()
│           │   ├── sendAutomaticEmergency...()
│           │   ├── startContinuousLocation...()
│           │   └── playSOSSiren()
│           │
│           └── Cleanup effects
│               └── stopContinuousLocation...()
│
├── server/
│   ├── routes.ts
│   │   ├── POST /api/sos ──────────────── Create alert
│   │   ├── POST /api/sos/:id/locations ─ Add location (called 5x/sec)
│   │   ├── GET /api/sos/:id/locations ─ Get history
│   │   ├── POST /api/mybuddy/chat ────── Process message
│   │   └── POST /api/emergency/guardians Get guardians
│   │
│   ├── storage.ts
│   │   ├── addSOSLocation()
│   │   ├── getSOSLocations()
│   │   ├── createSOSAlert()
│   │   └── getGuardians()
│   │
│   └── firebase-config.ts
│       └── sendEmergencyNotificationViaFirebase()
│
├── shared/
│   └── schema.ts
│       ├── SOSAlert
│       ├── SOSLocation
│       ├── User
│       └── Guardian
│
└── Documentation/
    ├── IMPLEMENTATION_GUIDE.md ───────── ✨ NEW
    ├── QUICK_START.md ────────────────── ✨ NEW
    ├── IMPLEMENTATION_SUMMARY.md ──────── ✨ NEW
    └── SYSTEM_ARCHITECTURE.md ────────── ✨ NEW (this file)
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       MyBuddy Page                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Input: User message                                        │ │
│  │ State: messages[], sosActive, sosId, locationInterval     │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────┬──────────────────────────────────────────────────┬─┘
             │                                                  │
    ┌────────▼─────────────┐                         ┌────────▼────────┐
    │   processUserInput()  │                         │ emergencyAPI    │
    │   from autocorrect.ts │                         │ sosAPI          │
    │                       │                         │ sendAutomatic...│
    │  ┌─────────────────┐  │                         │ from libs       │
    │  │ Split words     │  │                         └─────────────────┘
    │  │ Check dict      │  │
    │  │ Fuzzy match     │  │
    │  │ Detect keywords │  │
    │  └─────────────────┘  │
    │                       │
    │  Returns:            │
    │  - corrected text    │
    │  - hasChanges: bool  │
    │  - isEmergency: bool │
    └───────────┬──────────┘
                │
        Show toast to user
        ("Text corrected")
                │
                ▼
    ┌────────────────────┐
    │  mybuddyAPI.chat() │
    │  Send to backend   │
    │  Get response      │
    └─────────┬──────────┘
              │
    Response with action flag
              │
        ┌─────┴────────┬─────────────┐
        │              │             │
        ▼              ▼             ▼
 sos_activated  contact_  suggest_
                guardian   sos
        │              │             │
        ▼              ▼             ▼
    [SOS WORKFLOW]  Trigger     Show
                    Guardian    Warning
                    Alert
        │
        ├─ getGuardians() → DB query
        │
        ├─ formatMessages() → Create WhatsApp + SMS text
        │
        ├─ sendAutomatic...() → Opens native apps
        │  ├─ WhatsApp (wa.me)
        │  ├─ SMS (sms:)
        │  └─ Call (tel:)
        │
        ├─ sosAPI.create() → DB insert
        │
        ├─ startContinuousLocation...() → Polling loop
        │  ├─ Every 5 seconds:
        │  │  ├─ getLocation()
        │  │  ├─ getBatteryLevel()
        │  │  └─ sosAPI.addLocation() POST
        │  └─ Continue until stopContinuous...()
        │
        └─ playSOSSiren() + enableFlashlight()
           │
           ├─ Audio playback
           └─ Brightness API call
```

---

## State Management Flow

### MyBuddy Page State

```
Initial State:
├── messages: [] ─────────────────── Chat history
├── inputMessage: "" ──────────────── User's current input
├── isListening: false ────────────── Voice input active?
├── isSpeaking: false ─────────────── TTS active?
├── isLoading: false ──────────────── Waiting for API?
├── sosActive: false ──────────────── SOS currently active?
├── sosId: null ────────────────────── Current SOS ID (if active)
└── locationUpdateIntervalRef: null ─ Polling interval handle

State Changes:
┌─ sendMessage()
│  ├─ setMessages() add user message
│  ├─ setInputMessage("") clear input
│  ├─ setIsLoading(true)
│  │
│  ├─ Process message (autocorrect)
│  │
│  ├─ API call to /mybuddy/chat
│  │
│  ├─ setMessages() update with response
│  │
│  ├─ If sos_activated:
│  │  ├─ setSOSActive(true)
│  │  ├─ setSOSId(newSosId)
│  │  └─ locationUpdateIntervalRef.current = setInterval(...)
│  │
│  └─ setIsLoading(false)
│
├─ activateSOSFromMyBuddy()
│  ├─ setSOSActive(true)
│  ├─ setSOSId(newSosId)
│  └─ locationUpdateIntervalRef.current = setInterval(...)
│
├─ Cleanup effect (on unmount)
│  └─ stopContinuousLocationUpdates(locationUpdateIntervalRef.current)
│
└─ startListening()
   └─ setIsListening(true/false)
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│    Error at Each Stage                  │
└─────────────────────────────────────────┘
         │
    ┌────┴──────────────────┬──────────────────┐
    │                       │                  │
    ▼                       ▼                  ▼
Autocorrect            API Call           SOS Activation
Fails (unlikely)       Fails (network)    Fails (no guardian)
    │                       │                  │
    ├─ Log error     ├─ Toast error    ├─ Partial success
    └─ Use original  ├─ Use original   ├─ Toast warning
       text          │ message         └─ Siren still plays
                     ├─ Retry prompt   
                     └─ Fallback msg   
                                        
Notification Sends:
├─ WhatsApp fails ────→ Continue to SMS
├─ SMS fails ─────────→ Continue to calls
└─ All fail ──────────→ Toast "Notifications sent but may not deliver"
                       (Platform limitations - user opens app manually)

Location Update Fails:
├─ Permission denied ──→ Log, continue (user granted permission)
├─ Network error ──────→ Retry next cycle
├─ Invalid location ───→ Skip this update, try next cycle
└─ All fail ───────────→ Continue trying, no user interrupt
```

---

## Performance Timeline (Typical SOS)

```
t=0ms    User says "I need help"
         ├─ Input captured
         └─ Focus on input field

t=5ms    User presses Enter
         ├─ setIsLoading(true)
         └─ Start processing

t=10ms   Autocorrect runs
         ├─ Split to words (~1ms)
         ├─ Check dictionary (~2ms)
         ├─ Levenshtein distance (~2ms)
         └─ Show toast

t=50ms   getCurrentLocation() initiated
         ├─ Browser requests GPS
         └─ May take 100-500ms depending on signal

t=500ms  Location received
         ├─ getBatteryLevel() (~10ms)
         └─ API call initiated

t=1000ms Backend processes
         ├─ Classify message (~50ms)
         ├─ Generate response (~100-500ms depending on AI)
         └─ Determine action flag

t=1500ms Response received by frontend
         ├─ setMessages() with response
         ├─ Detect sos_activated action
         └─ Start SOS workflow

t=1510ms Get guardians from DB
         ├─ Query execution (~50ms)
         └─ Guardians list received

t=1560ms Format messages for guardians
         ├─ Create WhatsApp text (~5ms)
         ├─ Create SMS text (~5ms)
         └─ Create call list (~1ms)

t=1575ms Send notifications (all async)
         ├─ Open WhatsApp (platform handles)
         ├─ Open SMS (platform handles)
         └─ Initiate calls (platform handles)

t=1580ms Create SOS alert in DB
         ├─ Insert row (~50ms)
         └─ Get back sosId

t=1635ms Start location polling
         ├─ Get first location (~10ms)
         ├─ POST to /locations (~50ms)
         └─ Set interval for next 5 seconds

t=1700ms Play siren + flashlight
         ├─ playSOSSiren() starts
         └─ enableFlashlight() activates

t=1700ms Return to user
         ├─ MyBuddy response displayed
         └─ SOS status shown in UI

t=5000ms First location update cycle
         ├─ Poll GPS (~20ms)
         ├─ POST location (~50ms)
         └─ Set next interval

t=10000ms Second location update
t=15000ms Third location update
... (continues every 5 seconds)

User stops SOS at t=60000ms
├─ Clear interval
├─ Stop siren
├─ Update SOS status in DB
└─ Show confirmation toast
```

---

## Security & Privacy Flow

```
User Location Data:
┌──────────────────┐
│ Browser GPS API  │
│ (permission      │
│  required)       │
└────────┬─────────┘
         │ Only during SOS
         ▼
    ┌────────────────────┐
    │ App Memory         │
    │ (volatile)         │
    └────────┬───────────┘
             │ Via HTTPS
             │ POST every 5s
             ▼
    ┌─────────────────────────┐
    │ Server Database         │
    │ (encrypted at rest)     │
    │ sosLocations table      │
    └────────┬────────────────┘
             │
             ├─ Guardian can view via app
             │ (only their users' locations)
             │
             └─ Deleted after SOS resolved
               (configurable retention)

Guardian Phone Numbers:
├─ Stored in DB (encrypted)
├─ Never logged
├─ Only used for:
│  ├─ WhatsApp Web link (client-side)
│  ├─ SMS native (client-side)
│  └─ Tel dialer link (client-side)
└─ Not sent to third parties

Messages:
├─ Chat messages stored in DB
├─ Can be deleted by user
├─ Not monitored by app
└─ Only AI analysis happens server-side
```

---

## Deployment Architecture

```
Development:
localhost:5000 (Vite dev server)
│
├─ HTTPS required for geolocation
│  └─ Use ngrok/localtunnel
│
└─ Test all 6 languages
   Test autocorrect
   Test SOS notifications

Production:
┌──────────────────────────┐
│ SafebuddyGuardian.app    │
│ (React + Vite build)     │
└───────────┬──────────────┘
            │ HTTPS
            ▼
┌──────────────────────────────┐
│ Backend (Node.js)            │
│ /api/sos/*                   │
│ /api/mybuddy/*               │
│ /api/emergency/*             │
└───────┬───────────┬──────────┘
        │           │
        ▼           ▼
    Database    Firebase
    (Users,     (Messaging,
    SOSAlerts,  Notifications)
    Locations)
```

---

## Testing Matrix

```
Feature              Browser  iOS    Android  Status
─────────────────────────────────────────────
Autocorrect          ✅       ✅     ✅       Tested
Translations (6)     ✅       ✅     ✅       Tested
Location Updates     ✅       ⚠️     ⚠️       Platform-dependent
WhatsApp Send        ❌       ✅     ✅       Web limitation
SMS Send             ❌       ✅     ✅       Web limitation
Phone Calls          ❌       ✅     ✅       Web limitation
Siren Playback       ✅       ✅     ✅       Audio API
Flashlight           ❌       ⚠️     ✅       iOS Torch API
Background Location  ❌       ⚠️     ⚠️       Service needed
Battery Optimization ❌       ⚠️     ⚠️       OS-dependent

Legend:
✅ = Fully working
⚠️  = Partially working / platform-specific
❌ = Not available (platform limitation)
```

---

This architecture ensures:
- **Modularity**: Each component has single responsibility
- **Scalability**: Can handle many concurrent SOS alerts
- **Reliability**: Multiple fallbacks (SMS backup, etc.)
- **Privacy**: Location only during emergency
- **Performance**: Async operations, non-blocking
- **Accessibility**: 6-language support
- **User Experience**: Automatic, no extra clicks needed
