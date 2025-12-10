# 🔐 Security Setup Guide

## Before Running This App

**IMPORTANT:** Never use credentials from any public repository, including this one. Always generate your own fresh credentials for each environment.

---

## Step 1: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Enable these services:
   - **Cloud Messaging (FCM)** – for push notifications
   - **Realtime Database** – for location streaming
   - **Cloud Storage** – for media uploads

### Get Server-Side Credentials (Backend)
1. Go to **Settings → Service Accounts**
2. Click **Generate New Private Key**
3. Copy the JSON content
4. Add to your `.env`:
   ```
   FIREBASE_PRIVATE_KEY=<paste entire JSON here as single line>
   FIREBASE_PROJECT_ID=<from JSON>
   FIREBASE_CLIENT_EMAIL=<from JSON>
   ```

### Get Client-Side Credentials (Frontend)
1. Go to **Settings → Your apps → Web app**
2. Copy the Firebase config object
3. Add to your `.env`:
   ```
   VITE_FIREBASE_PROJECT_ID=projectId
   VITE_FIREBASE_AUTH_DOMAIN=authDomain
   VITE_FIREBASE_STORAGE_BUCKET=storageBucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=messagingSenderId
   VITE_FIREBASE_APP_ID=appId
   ```

### Create a Fresh API Key (Important!)
1. Go to **Google Cloud Console → APIs & Services → Credentials**
2. Click **Create Credentials → API Key**
3. **Immediately restrict it:**
   - **API Restrictions:** Select only "Cloud Messaging API", "Maps SDK", and any other APIs your app uses
   - **Application Restrictions:** Set to "HTTP referrers (web sites)"
   - **Allowed referrers:** Add your production domain (e.g., `https://yourdomain.com/*`)
4. Copy the key and add to `.env`:
   ```
   VITE_FIREBASE_API_KEY=<your-new-restricted-key>
   ```

---

## Step 2: Set Up Twilio (Optional - for SMS)

1. Create a [Twilio Account](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Buy a phone number for SMS
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=<your-sid>
   TWILIO_AUTH_TOKEN=<your-token>
   TWILIO_PHONE_NUMBER=+1234567890
   ```

---

## Step 3: Set Up Database

1. Create a PostgreSQL database (use [Neon](https://neon.tech) for serverless)
2. Add to `.env`:
   ```
   DATABASE_URL=postgres://user:password@host:5432/safebuddy
   ```

---

## Step 4: Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all values from steps 1-3

3. Add a strong session secret:
   ```
   SESSION_SECRET=<generate-a-random-32-char-string>
   ```

---

## Step 5: Run the App

```bash
npm install
npm run dev
```

Then open http://localhost:5000

---

## Deploying to Production

### Render / Railway / Vercel
1. **Never commit `.env` to git**
2. Use the platform's environment dashboard to set variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` (as full JSON on one line)
   - `FIREBASE_CLIENT_EMAIL`
   - `VITE_FIREBASE_API_KEY` (your restricted key)
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `DATABASE_URL`
   - `SESSION_SECRET`

3. Deploy using platform's build command: `npm run build && npm start`

---

## Security Best Practices

✅ **Do:**
- Generate fresh credentials for each environment (dev, staging, production)
- Restrict API keys by referrer and API type
- Use strong, unique `SESSION_SECRET` per environment
- Enable Firebase security rules to protect your data
- Monitor API usage and costs regularly
- Rotate keys quarterly

❌ **Don't:**
- Commit `.env` files to git (use `.env.example` template instead)
- Use the same credentials across environments
- Share Firebase private keys or Twilio tokens
- Copy credentials from public repos or tutorials
- Leave API keys unrestricted (anyone can abuse them and you pay the bill)

---

## Troubleshooting

### Push Notifications Not Working
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check `VITE_FIREBASE_API_KEY` is set correctly
- Ensure FCM is enabled in Firebase Console
- Browser must grant notification permission

### SMS Not Sending
- Verify Twilio credentials are correct
- Check Twilio account has enough balance
- Ensure `TWILIO_PHONE_NUMBER` is active and verified

### Database Connection Failed
- Verify `DATABASE_URL` is accessible from your server
- Check PostgreSQL is running (if local)
- Ensure firewall allows connections

---

**Last Updated:** December 10, 2025

For questions or issues, open a GitHub issue: https://github.com/Shreeya9906/SafeBuddy/issues
