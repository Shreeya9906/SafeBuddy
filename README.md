# SafeBuddy Guardian+ 🛡️

**A complete multilingual emergency safety app with real-time SOS alerts, live location tracking, guardian notifications via WhatsApp/SMS/Push, and an AI chatbot assistant.**

SafeBuddy Guardian+ is a full‑stack personal safety application for Indian users. It lets anyone trigger instant SOS alerts, share live GPS location with trusted guardians, notify multiple contacts via WhatsApp/SMS/push notifications, and chat with **MyBuddy** – a multilingual AI safety assistant supporting 6 Indian languages (English, Hindi, Tamil, Telugu, Kannada, Malayalam).

**Key Features:**
- 🆘 **Instant SOS** with siren sound & flashlight activation
- 📍 **Live Location Sharing** with real-time GPS streaming & address reversal
- 📱 **Multi-Channel Guardian Alerts** – WhatsApp calls, direct phone calls, SMS, push notifications (3-layer redundancy)
- 🤖 **MyBuddy AI Assistant** – Multilingual chatbot with smart autocorrect & intent detection
- 👥 **Guardian Management** – Add/edit trusted contacts with instant one-click emergency calling
- 🌍 **6 Language Support** – Automatic language detection (en_IN, hi_IN, ta_IN, te_IN, kn_IN, ml_IN)
- 📡 **Firebase Cloud Messaging** – Real-time push notifications to all guardian devices
- 🔐 **Secure Authentication** – Passport.js sessions with encrypted credentials
- 📊 **Health Vitals Tracking** – Optional pulse/SpO2 monitoring (future expansion)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Wouter |
| **Backend** | Node.js 18+, Express.js, Passport.js (sessions) |
| **Database** | PostgreSQL + Drizzle ORM (Neon serverless) |
| **Notifications** | Firebase Cloud Messaging (FCM), Twilio SMS |
| **Integrations** | WhatsApp Web (wa.me), Native Phone Dialer (tel:), OpenWeather API |

---

## Quick Start

### Prerequisites
- **Node.js 18+** (v20 recommended)
- **PostgreSQL** database (Neon, AWS RDS, local, etc.)
- **Firebase** project with service account credentials
- **Twilio** account (optional, for SMS)
- **OpenWeather API key** (optional, for weather widget)

### Installation

```bash
# Clone repository
git clone https://github.com/Shreeya9906/SafeBuddy.git
cd SafeBuddy

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Configure environment variables (see section below)
# then start development server
npm run dev
```

Open **http://localhost:5000** in your browser.

---

## Environment Variables

Create a `.env` file in the project root. See `.env.example` for template.

### Required Variables (Production)

```bash
# Database (required)
DATABASE_URL=postgres://username:password@host:5432/safebuddy_db

# Session security (required in production)
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Firebase Admin SDK (for push notifications)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project"...}
```

### Optional Variables

```bash
# Twilio SMS (app works without SMS, but emergency alerts won't include SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenWeather (for weather widget)
OPENWEATHER_API_KEY=your_api_key
VITE_OPENWEATHER_API_KEY=your_api_key

# Application (optional)
PORT=5000
NODE_ENV=development
```

> **Security Note:** Never commit `.env` to git. Use `.env.example` template instead. Render/Railway will inject these via dashboard.

---

## Running the App

### Development Mode
```bash
npm run dev
```
- Starts Express server on port 5000
- Vite dev middleware hot-reloads frontend changes
- Open http://localhost:5000

### Production Build
```bash
npm run build    # Compiles client (Vite) & server (esbuild)
npm start        # Runs compiled dist/index.js
```

### Database Migrations
```bash
npm run db:migrate   # Apply pending migrations
npm run db:reset     # Full database reset (dev only)
npm run db:studio    # Open Drizzle Studio for DB inspection
```

---

## Core Features

### 🆘 SOS Emergency Alert
**How it works:**
1. User presses **"SOS" button** or voice-activates via "call guardian"
2. **Automatic multi-channel notifications sent:**
   - 📲 WhatsApp call initiated to primary guardian
   - ☎️ Direct phone call (tel: protocol)
   - 💬 WhatsApp message: "🆘 HELP NEEDED: I need to talk to you immediately!"
   - 📨 SMS to all guardians: "🚨 EMERGENCY: [User] is trying to reach you urgently"
   - 🔔 Firebase push notification to all guardian devices
3. **Simultaneously:**
   - 📍 Live location shared with all guardians
   - 🔊 Siren sound plays on user's device
   - 💡 Flashlight activates (if permission granted)

**Code Location:** `client/src/pages/mybuddy.tsx` (lines 225-263)

### 🤖 MyBuddy AI Assistant
**Multilingual emergency chatbot** with:
- **Intent Detection:** Automatically recognizes "call guardian" or "emergency" keywords
- **Smart Autocorrect:** Levenshtein distance algorithm for typo correction (exact matches only)
- **6 Language Support:** Auto-detects user's language preference
- **Emergency Escalation:** Triggers SOS if user types "call mom", "call dad", "call guardian", etc.
- **Conversation Memory:** Maintains chat history within session

**Example Interactions:**
```
User (English): "I need to call my mom"
MyBuddy: "🚨 Alerting your guardians immediately! Mom, Dad, and Neighbors notified!"

User (Hindi): "मुझे अपने पिता को कॉल करना है"
MyBuddy: "मैं तुरंत अपने अभिभावकों को सचेत कर रहा हूं!"
```

**Code Location:** `server/routes.ts` (lines 720-793)

### 📍 Live Location Sharing
- **Real-time GPS tracking** with permission handling
- **Address reversal** – Converts coordinates to readable location names
- **Continuous streaming** – Updates guardian devices every 5 seconds
- **Multi-guardian support** – All trusted guardians see live location

### 📱 Guardian Management
- **Add/edit trusted contacts** with phone numbers
- **Instant SOS activation** – One-click to call nearest guardian
- **Priority ordering** – Set primary/secondary guardians
- **Emergency contact database** – Encrypted storage in PostgreSQL

**API Endpoint:** `GET /api/users/:userId/guardians`

---

## Notification System

SafeBuddy uses a **3-layer redundant notification system** to ensure guardians are reached:

```
┌─────────────────────────────────────────────────┐
│           Emergency Triggered                    │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    Firebase    WhatsApp     Twilio
    Push (0ms)  Message     SMS
              (300ms)      (500ms)
```

**Layer 1: Firebase Cloud Messaging (FCM)**
- Instant push notification to all guardian devices
- Works only if app is installed
- Fastest delivery (0ms)

**Layer 2: WhatsApp**
- Automatic WhatsApp message with emergency alert
- Opens WhatsApp dialer for voice call
- Works via `wa.me/` web link protocol
- Medium latency (300ms)

**Layer 3: SMS + Phone Call**
- Twilio SMS with emergency message
- Direct phone call via `tel:` protocol
- Works on any phone (no app required)
- Slowest but most reliable (500ms)

**Code Location:**
- Firebase: `client/src/lib/firebase-messaging.ts`
- WhatsApp: `client/src/lib/whatsapp.ts`
- SMS: `server/twilio-sms.ts`
- Routes: `server/routes.ts` (lines 720-793)

---

## API Documentation

### Authentication
All endpoints require valid session (Passport.js).

### Guardian Endpoints
```bash
# Get all guardians for a user
GET /api/users/:userId/guardians
Response: [{ id, name, phone, relationship, isPrimary }]

# Add new guardian
POST /api/users/:userId/guardians
Body: { name, phone, relationship, isPrimary }

# Update guardian
PUT /api/users/:userId/guardians/:guardianId
Body: { name, phone, isPrimary }

# Delete guardian
DELETE /api/users/:userId/guardians/:guardianId
```

### SOS & Emergency
```bash
# Trigger SOS alert
POST /api/users/:userId/emergency/sos
Body: { latitude, longitude, address }
Response: { success, notificationsSent }

# Get emergency history
GET /api/users/:userId/emergency/history
Response: [{ timestamp, type, recipientCount, status }]
```

### MyBuddy Chat
```bash
# Send chat message
POST /api/chat/mybuddy
Body: { userId, message, language }
Response: { reply, intent, actionTriggered }
```

### Location
```bash
# Stream live location
POST /api/location/stream
Body: { userId, latitude, longitude }

# Get location history
GET /api/location/history/:userId
```

---

## Deployment

### Deploy to Render

1. **Create Web Service from GitHub**
   - Repository: `https://github.com/Shreeya9906/SafeBuddy.git`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Runtime: Node 18+

2. **Set Environment Variables in Render Dashboard**
   ```
   DATABASE_URL=postgres://...
   SESSION_SECRET=your-secret-key
   FIREBASE_SERVICE_ACCOUNT={...}
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   ```

3. **Deploy**
   - Push code to GitHub → auto-deploys

### Deploy to Railway

1. **Connect GitHub repository**
2. **Add PostgreSQL plugin** (Railway will auto-generate `DATABASE_URL`)
3. **Configure Environment**
   - Set `SESSION_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, etc.
4. **Deploy**
   - Railway detects `package.json` and auto-builds

### Deploy to Vercel (Frontend Only)

If you want to separate frontend and backend:

```bash
# Frontend only
npm run build:client
# Deploy dist/public to Vercel
# Update API endpoints to point to backend
```

---

## Troubleshooting

### Database Connection Error
```
ERROR: DATABASE_URL environment variable is required
```
**Fix:** Set `DATABASE_URL` in `.env` or hosting platform's dashboard.

### Session Secret Error (Production)
```
ERROR: SESSION_SECRET environment variable is required in production
```
**Fix:** Set `SESSION_SECRET` when `NODE_ENV=production`.

### Firebase Notifications Not Arriving
```
✗ Push notifications not received by guardians
```
**Checklist:**
- ✅ Valid `FIREBASE_SERVICE_ACCOUNT` JSON in `.env`
- ✅ Browser notifications are allowed in settings
- ✅ Device tokens registered in database (`user_notification_tokens` table)
- ✅ Firebase project ID matches credentials JSON
- ✅ Guardians have app installed OR signed up for web push

### WhatsApp Not Opening
```
✗ WhatsApp button click does nothing
```
**Fix:**
- Check phone number is formatted correctly (+91XXXXXXXXXX for India)
- User must have WhatsApp installed
- Replace `wa.me` with `https://wa.me` if using web app
- Android: Ensure Chrome can handle `intent://` URIs

### SMS Not Sending
```
✗ Twilio SMS sending fails
```
**Checklist:**
- ✅ Valid Twilio credentials in `.env`
- ✅ `TWILIO_PHONE_NUMBER` is active on Twilio account
- ✅ Guardian phone number is valid
- ✅ Twilio account has enough balance/credits

---

## Project Structure

```
SafeBuddy/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/         # UI components (sidebar, modals, widgets)
│   │   ├── pages/              # Main pages (mybuddy, dashboard, settings)
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   ├── whatsapp.ts     # WhatsApp integration
│   │   │   ├── firebase-messaging.ts  # Push notifications
│   │   │   ├── geolocation.ts  # GPS tracking
│   │   │   └── language-styles.ts    # i18n
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
│
├── server/                      # Node.js Express backend
│   ├── app.ts                  # Express app setup
│   ├── routes.ts               # All API endpoints
│   ├── auth.ts                 # Passport.js config
│   ├── firebase-config.ts      # Firebase Admin SDK
│   ├── twilio-sms.ts           # SMS helper
│   ├── mybuddy-translations.ts # 6-language translation DB
│   ├── medical-advisor.ts      # Health advisory (future)
│   └── storage.ts              # Cloud storage helper
│
├── shared/
│   └── schema.ts               # Database schema (Drizzle)
│
├── db.ts                        # Database config
├── drizzle.config.ts           # Drizzle migrations config
├── vite.config.ts              # Vite bundling config
├── tsconfig.json               # TypeScript config
├── package.json
├── .env.example                # Environment template
├── .gitignore                  # Git exclusions (secrets protected)
└── README.md                   # This file
```

---

## Database Schema

Key tables:
- `users` – User accounts (id, email, phone, language, created_at)
- `guardians` – Trusted contacts (user_id, name, phone, relationship)
- `sos_alerts` – Emergency history (user_id, timestamp, location, status)
- `chat_history` – MyBuddy conversations (user_id, message, reply, language)
- `locations` – GPS history (user_id, latitude, longitude, timestamp)
- `user_notification_tokens` – Device tokens for push (user_id, token, device_type)

See `shared/schema.ts` for full schema.

---

## Security

**Credentials Protection:**
- All sensitive env vars in `.env` (excluded from git via `.gitignore`)
- Firebase service account credentials never logged
- Twilio API keys not exposed in frontend
- Session secret uses strong encryption
- `.env.example` provides template without secrets

**Git History:**
- Entire git history cleaned to remove any leaked credentials
- Rewritten using `git filter-branch` (369 commits sanitized)
- No sensitive data in GitHub repository

**Authentication:**
- Passport.js session-based auth
- Secure HTTP cookies with `httpOnly` and `secure` flags
- CSRF protection on form submissions

**Data Privacy:**
- Encrypted database connections (SSL)
- Location data only shared with authorized guardians
- Chat history stored per-user with no cross-user access

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

---

## License

MIT License – See LICENSE file

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/Shreeya9906/SafeBuddy/issues
- Email: support@safebuddy.dev (coming soon)

---

## Roadmap

- ✅ Multi-language support (6 languages)
- ✅ WhatsApp integration for emergency calls
- ✅ SMS notifications via Twilio
- ✅ Live location sharing with real-time updates
- ✅ MyBuddy AI assistant with autocorrect
- 🔄 Health vitals tracking (pulse, SpO2)
- 🔄 Wearable integration (smartwatch SOS)
- 🔄 Voice command activation
- 🔄 Community safety network (nearby users)
- 🔄 Police/Hospital integration
- 🔄 Multi-language voice support (TTS/STT)

---

**Made with ❤️ for safety. Built for India.**
