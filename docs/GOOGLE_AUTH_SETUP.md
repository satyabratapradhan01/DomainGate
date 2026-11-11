# DomainGate - Google Authentication Setup Guide
### Complete Multi-Platform Configuration (Android, iOS & Web)

This guide provides step-by-step instructions to configure Google OAuth 2.0 with Firebase Authentication for DomainGate across **Android**, **iOS**, and **Web**.

---

## 1. Firebase Authentication Setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and select or create your project: `domaingate-hbplus`.
2. Navigate to **Authentication** > **Sign-in method**.
3. Enable **Google** as a Sign-in provider.
4. Set the **Project support email** to your authorized administrator address.
5. In **Authorized domains**, ensure the following domains are whitelisted:
   - `localhost`
   - `domaingate-hbplus.firebaseapp.com`
   - `<your-app-name>.netlify.app` (your Netlify production deployment domain)

---

## 2. Platform-Specific Configurations

### A. Web Configuration
- **Method Used**: Firebase JavaScript SDK `signInWithPopup(auth, googleAuthProvider)`.
- **Handling Popups**: Handled automatically in `AuthService.signInWithGoogleWeb()` with error recovery for `auth/popup-closed-by-user` and `auth/popup-blocked`.
- **Environment Variables**:
  In `.env` or Netlify Environment Variables:
  ```env
  EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=domaingate-hbplus.firebaseapp.com
  EXPO_PUBLIC_FIREBASE_PROJECT_ID=domaingate-hbplus
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=domaingate-hbplus.appspot.com
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=102938475610
  EXPO_PUBLIC_FIREBASE_APP_ID=1:102938475610:web:...
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=102938475610-web-domaingate.apps.googleusercontent.com
  ```

---

### B. Android Configuration
1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** of type **Android**:
   - **Package name**: `com.domaingate.auth` (matches `app.json`)
   - **SHA-1 certificate fingerprint**:
     - For debug:
       ```bash
       cd android && ./gradlew signingReport
       ```
       *(or from default debug keystore: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`)*
     - For EAS cloud build: run `eas credentials` to retrieve your build's SHA-1.
2. In `app.json`, ensure the custom scheme and package name match:
   ```json
   {
     "expo": {
       "scheme": "domaingate",
       "android": {
         "package": "com.domaingate.auth"
       }
     }
   }
   ```
3. Set your Android Client ID in `.env`:
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=<your-android-client-id>.apps.googleusercontent.com
   ```
4. **Credential Flow**:
   - `useGoogleAuth` initiates the OAuth session with `Google.useIdTokenAuthRequest`.
   - The returned `id_token` is exchanged for a Firebase credential:
     ```typescript
     const credential = GoogleAuthProvider.credential(googleIdToken);
     await signInWithCredential(auth, credential);
     ```

---

### C. iOS Configuration
1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** of type **iOS**:
   - **Bundle ID**: `com.domaingate.auth` (matches `app.json`)
2. In `app.json`, verify iOS configuration:
   ```json
   {
     "expo": {
       "scheme": "domaingate",
       "ios": {
         "bundleIdentifier": "com.domaingate.auth"
       }
     }
   }
   ```
3. Set your iOS Client ID in `.env`:
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=<your-ios-client-id>.apps.googleusercontent.com
   ```
4. **Credential Flow**:
   - Works identically to Android via `expo-auth-session`.
   - Native redirect URL resolves cleanly to `domaingate://`.

---

## 3. Security Best Practices Implemented

- ✅ **No Hardcoded Secrets**: Client secrets are NEVER bundled or distributed in the mobile/web clients (client secret is not needed or allowed in public OAuth PKCE or ID Token flows).
- ✅ **Single Shared Security Boundary**: Regardless of whether the user signs in on Chrome, Safari, Android, or iOS, authentication results pass through `AuthService.enforceSecurityBoundary()`.
- ✅ **Domain Enforcement**: Only verified accounts matching `@hbplus.fit` are admitted. All other accounts trigger an atomic teardown (`auth.signOut()`, token wiping, quarantine).
- ✅ **Server-Side Identity Blocking Functions**: In production, Firebase Cloud Functions (`firebase/functions/index.js`) block unauthorized account creation before any token can be minted.
