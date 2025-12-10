# 🔒 Security Setup Guide

**IMPORTANT:** Never commit API keys, Firebase credentials, or secrets to Git. This guide shows how to configure them safely.

---

## Firebase & Google Cloud Setup

### Step 1: Get Your Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your SafeBuddy project
3. Navigate to **APIs & Services** → **Credentials**

#### Create/Retrieve API Keys

**For Frontend (Firebase Client Config):**
- Create a new **API Key** (not OAuth, not Service Account)
- Name it: `SafeBuddy Frontend Key`
- Click the key to edit and add **Restrictions**:
  - **API restrictions**: Enable only these:
    - Firebase
    - Google Maps Platform (if using maps)
    - Weather API (if using OpenWeather)
  - **Application restrictions**: 
    - Type: `HTTP referrers`
    - Values: `https://yourdomain.com/*` (or localhost for dev)

**Copy these 6 values** (you'll need them for Step 2):
```
API_KEY = AIzaSy...xxxxx
AUTH_DOMAIN = safebuddy-guardian.firebaseapp.com
PROJECT_ID = safebuddy-guardian
STORAGE_BUCKET = safebuddy-guardian.appspot.com
MESSAGING_SENDER_ID = 1234567890
APP_ID = 1:1234567890:web:xxxxx
```

---

## Local Development Setup

### Step 2: Create `.env` file (Never commit this!)

1. In project root, create `.env` file:
```bash
# Copy .env.example as template
cp .env.example .env
```

2. Open `.env` and paste your credentials:
```env
# Database
DATABASE_URL=postgres://user:password@host:5432/safebuddy

# Session
SESSION_SECRET=your-random-secret-key-here-min-32-chars

# Firebase (paste from Step 1)
VITE_FIREBASE_API_KEY=AIzaSy...xxxxx
VITE_FIREBASE_AUTH_DOMAIN=safebuddy-guardian.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safebuddy-guardian
VITE_FIREBASE_STORAGE_BUCKET=safebuddy-guardian.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=106082998919040703679
VITE_FIREBASE_APP_ID=1:106082998919040703679:web:xxxxx

# Firebase Server (from service account JSON - paste one line)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"safebuddy-guardian",...}

# Twilio (optional SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenWeather (optional)
OPENWEATHER_API_KEY=your_api_key
VITE_OPENWEATHER_API_KEY=your_api_key

# Application
PORT=5000
NODE_ENV=development
```

3. **Important**: `.env` is already in `.gitignore` — verify it won't be committed:
```bash
git status  # Should NOT show .env
```

4. Start the app:
```bash
npm install
npm run dev
```

---

## Production Deployment

### Render / Railway / Vercel

**Do NOT paste `.env` file content directly!**

Instead, use your hosting platform's **Environment Variables** dashboard:

#### For Render:
1. Dashboard → Your Service → **Environment**
2. Add each variable individually:
   - Key: `VITE_FIREBASE_API_KEY`
   - Value: `AIzaSy...xxxxx`
3. Repeat for all variables
4. Click **Save** and redeploy

#### For Railway:
1. Project → **Variables**
2. Add each variable same way as Render
3. Deploy

#### For Vercel:
1. Project → **Settings** → **Environment Variables**
2. Add variables same way
3. Redeploy

---

## Security Checklist

- [ ] `.env` file is in `.gitignore` (verify with `git status`)
- [ ] No `.env` or credentials committed to Git
- [ ] API Key has **API restrictions** (not all APIs enabled)
- [ ] API Key has **HTTP referrer restrictions** (not unrestricted)
- [ ] Firebase Service Account is **never logged** (check server logs)
- [ ] Twilio credentials are **environment variables only**
- [ ] `.env.example` has NO real credentials (only placeholders)
- [ ] Hosting platform's Environment Variables are configured
- [ ] Database password is strong (min 32 chars, mix of uppercase, numbers, symbols)
- [ ] `SESSION_SECRET` is random & strong (min 32 chars)
- [ ] GitHub repo is set to **Private** (if sensitive)
- [ ] GitHub secret scanning enabled (Settings → Security → Secret scanning)
- [ ] No credentials in README, docs, or code comments

---

## If Credentials Are Leaked

**IMMEDIATE ACTION:**

1. **Revoke the old key immediately** (Google Cloud Console → delete the key)
2. **Create a new key** with the same restrictions
3. **Update** all environment variables (local `.env` and hosting platforms)
4. **Redeploy** the app
5. **Monitor** Google Cloud billing for suspicious activity
6. **Rewrite git history** if the key was committed:
   ```bash
   git filter-branch -f --index-filter \
     'git rm -r --cached --ignore-unmatch .env' \
     --prune-empty -- --all
   git push origin main -f
   ```

---

## File Structure (What Gets Committed)

```
SafeBuddy/
├── .env                    ❌ NEVER commit (in .gitignore)
├── .env.example            ✅ Safe to commit (no real values)
├── .gitignore              ✅ Includes .env, *.json credentials
├── README.md               ✅ Safe to commit
├── SECURITY_SETUP.md       ✅ This file (instructions only)
├── server/
│   ├── firebase-config.ts  ✅ Safe (reads from env vars)
│   └── twilio-sms.ts       ✅ Safe (reads from env vars)
└── client/
    ├── src/lib/firebase-messaging.ts  ✅ Safe (uses VITE_* env vars)
    └── ...
```

---

## Testing Credentials Are Loaded

Run this to verify environment variables are loaded:

```bash
# Development
npm run dev

# Check logs for:
# ✅ Firebase Messaging initialized
# ✅ SMS notifications ready
# ✅ Database connected
```

If you see errors like `FIREBASE_SERVICE_ACCOUNT is required`, it means `.env` is missing or incomplete.

---

## Questions?

If credentials don't work:
1. Verify `.env` file exists in project root
2. Verify syntax (no extra quotes or spaces)
3. Restart the dev server: `npm run dev`
4. Check that values match exactly (copy-paste from console, not manual typing)
5. For Render/Railway, wait 2-3 minutes after changing env vars for redeploy

