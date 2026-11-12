# DomainGate — Universal Cross-Platform Deployment Guide

This document details the complete end-to-end process for deploying and running **DomainGate** across:
1. **Android Emulator & Physical Devices**
2. **iOS Simulator & Physical Devices**
3. **Web Browser (Local Development)**
4. **Netlify Production Deployment (Static SPA)**

---

## 1. Environment Variables & Production Build Mechanics

In Expo SDK 58, variables prefixed with `EXPO_PUBLIC_` are evaluated and bundled directly into the compiled JavaScript bundle at export time.

### Required Production Variables:
```ini
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=domaingate-7b979.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=domaingate-7b979
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=domaingate-7b979.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=291286972623
EXPO_PUBLIC_FIREBASE_APP_ID=1:291286972623:web:108fdda83429c8605d1fba
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=291286972623-ieadhmtk2avejsre8hb8oho2jih02r89.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
```

> [!NOTE]
> For local development, these values are loaded automatically from `.env`.  
> For Netlify, they must be set in the **Netlify Site settings > Environment variables** dashboard.

---

## 2. Web Browser (Local Execution)

### Step 1: Start Metro Web Bundler
```bash
npm run web
# Or: npx expo start --web
```

### Step 2: Access in Browser
Open `http://localhost:8081` in Chrome or Edge.

### Step 3: Google OAuth Configuration for Localhost
1. Navigate to **Google Cloud Console** > **Credentials** > **OAuth 2.0 Client IDs** (Web client).
2. Under **Authorized JavaScript origins**, ensure `http://localhost:8081` is present.
3. In **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**, ensure `localhost` is present.

---

## 3. Netlify Production Deployment (Web SPA)

DomainGate is optimized for static SPA hosting on Netlify using Expo Web Export.

### Architecture on Netlify
```
[User Browser]
      │
      ▼ (Requests /dashboard directly or clicks Back button)
[Netlify CDN Router]
      │── Matches file in dist/? (e.g. static JS/CSS/favicon) -> Serves static file
      └── Route not found? -> Fallback to /index.html (Status: 200 OK)
            │
            ▼
      [DomainGate React Router]
            └── Evaluates isAuthorized:
                  ├── If authorized: Renders <DashboardScreen />
                  └── If unauthorized: Renders <LoginScreen />
```

### Configuration Files Included in Repository
1. **`netlify.toml`**:
   ```toml
   [build]
     command = "npx expo export --platform web"
     publish = "dist"

   [build.environment]
     NODE_VERSION = "22.14.0"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```
2. **`public/_redirects`**:
   Automatically exported to `dist/_redirects`:
   ```
   /*    /index.html   200
   ```

### Method A: Automated Deployment via GitHub CI/CD (Recommended)
1. Push your repository to GitHub:
   ```bash
   git push origin origin
   ```
2. In the [Netlify Dashboard](https://app.netlify.com/):
   - Click **Add new site** > **Import an existing project**.
   - Choose **GitHub** and authorize access to `DomainGate`.
   - Configure build settings:
     - **Base directory**: (leave blank)
     - **Build command**: `npx expo export --platform web`
     - **Publish directory**: `dist`
3. Add Environment Variables:
   - Go to **Site configuration** > **Environment variables**.
   - Add all `EXPO_PUBLIC_*` variables from your `.env.example`.
4. Trigger Deploy:
   - Click **Deploy site**.
   - Netlify executes the build, compiles the bundle, and deploys the static files with SSL enabled.

### Method B: Manual Deployment via Netlify CLI
```bash
# 1. Install Netlify CLI globally
npm install -g netlify-cli

# 2. Build production web bundle
npm run build:web

# 3. Log in to Netlify
netlify login

# 4. Deploy directly to production
netlify deploy --prod --dir=dist
```

---

## 4. Android Emulator & Device Execution

### Prerequisites
- [Android Studio](https://developer.android.com/studio) with Android SDK and platform tools.
- An Android Virtual Device (AVD) running **Google Play Store / Google APIs** (system image with Google Play is required for Google Sign-In services).

### Step 1: Register Package & SHA-1 in Firebase
1. Package Name: `com.domaingate.auth` (defined in `app.json`).
2. Generate your local debug SHA-1 fingerprint:
   ```powershell
   keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```
3. In **Firebase Console** > **Project Settings** > **Your apps** > **Add Android App**:
   - Register package name `com.domaingate.auth`.
   - Paste the SHA-1 fingerprint.

### Step 2: Start Android Emulator
1. Open Android Studio > **Device Manager**.
2. Start your AVD (e.g. Pixel 8 Pro with Google Play, API 34).

### Step 3: Run DomainGate
```bash
# Start Expo Metro and launch Android
npm run android
# Or: npx expo start --android
```
Expo will compile the app and launch it on your active Android emulator.

---

## 5. iOS Simulator Execution (macOS)

### Prerequisites
- macOS running Xcode 15+ and Command Line Tools.
- iOS Simulator (iPhone 15 / 16).

### Step 1: Register Bundle ID in Firebase
1. Bundle Identifier: `com.domaingate.auth` (defined in `app.json`).
2. In **Firebase Console** > **Project Settings** > **Add iOS App**, register `com.domaingate.auth`.

### Step 2: Launch iOS Simulator
```bash
# Start Expo Metro and launch iOS
npm run ios
# Or: npx expo start --ios
```

---

## 6. Pre-Flight Verification Checklist

Before releasing to production or presenting to evaluators, verify the following steps:

- [ ] **Typecheck**: `npm run typecheck` passes with 0 errors.
- [ ] **Diagnostics**: `npm run doctor` reports 20/20 checks passed.
- [ ] **Test Suite**: `npm test` executes all 26 assertions across 6 scenarios with 100% pass rate.
- [ ] **Web Export**: `npm run build:web` succeeds in under 5 seconds.
- [ ] **Redirects File**: `dist/_redirects` contains `/* /index.html 200`.
- [ ] **Security Rules**: `firebase deploy --only firestore:rules` deployed to live Firebase project.
- [ ] **Clean Secrets**: `.env` is NOT tracked in git (`git status` is clean).

