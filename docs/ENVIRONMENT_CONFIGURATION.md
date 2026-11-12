# DomainGate — Environment Configuration & Secrets Management Guide

This document provides a security analysis and operational guide for environment variables, client-side configuration, and backend secrets management in **DomainGate**.

---

## 1. Public Client Configuration vs. Private Server Secrets

In modern web and mobile architectures (especially with Expo and React Native Web), understanding the boundary between **public client configuration** and **confidential secrets** is essential to application security.

### Summary Classification Table

| Environment Variable | Classification | Location | Can Be Public in Client Bundle? | Protection Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | **Public Client Identifier** | `.env` / Client App | **YES** | Cloud Firestore Security Rules, HTTP Referrer Restrictions, Android SHA-1 fingerprint. |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Public Client Identifier** | `.env` / Client App | **YES** | Firebase Authorized Domains List (OAuth redirect whitelist). |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | **Public Project Identifier** | `.env` / Client App | **YES** | IAM Permissions & Security Rules on Google Cloud. |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`| **Public Storage Identifier**| `.env` / Client App | **YES** | Cloud Storage Security Rules. |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **Public Identifier** | `.env` / Client App | **YES** | FCM routing only; cannot be used to read or modify data. |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | **Public App Identifier** | `.env` / Client App | **YES** | Identifies the client app registration within the Firebase project. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` | **Public OAuth Client ID** | `.env` / Client App | **YES** | Authorized JavaScript Origins & Authorized Redirect URIs in Google Cloud Console. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | **Public OAuth Client ID** | `.env` / Client App | **YES** | Bound to Android Package Name (`com.domaingate.app`) and SHA-1 signing fingerprint. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` | **Public OAuth Client ID** | `.env` / Client App | **YES** | Bound to iOS Bundle Identifier (`com.domaingate.app`). |
| **`FIREBASE_SERVICE_ACCOUNT_KEY`** | 🛑 **CONFIDENTIAL PRIVATE SECRET** | Server / CI Secrets ONLY | ❌ **NEVER** | Grants full root read/write access bypassing all security rules. |
| **`GOOGLE_OAUTH_CLIENT_SECRET`** | 🛑 **CONFIDENTIAL PRIVATE SECRET** | Server / Backend ONLY | ❌ **NEVER** | Used in confidential authorization code flows; never used in mobile/SPA apps. |
| **`NETLIFY_AUTH_TOKEN`** | 🛑 **CONFIDENTIAL PRIVATE SECRET** | CI/CD Platform ONLY | ❌ **NEVER** | Grants deployment and administrative control of web hosting. |

---

## 2. Why Firebase API Keys Are Public (and How They Are Secured)

A common misconception among developers is that the Firebase `apiKey` is a secret credential (like a database password or AWS secret key).

In reality:
1. **Firebase API keys are identifiers, not authorization tokens**:
   Every web and mobile app using Firebase sends this key over the wire with every request to route traffic to the correct Google Cloud project. An attacker can always inspect browser network tabs or decompile a mobile APK to see the Firebase API key.
2. **True Security Lies at the Data Layer**:
   Firebase security is enforced by:
   - **Cloud Firestore Security Rules** (`firestore.rules`): Restricts read/write operations exclusively to verified accounts belonging to `@hbplus.fit`.
   - **Google Cloud Identity Platform Blocking Functions**: Intercepts user creation and sign-in before any token is issued.
   - **API Key Restrictions in Google Cloud Console**:
     - **Application restrictions**: Restrict key usage to your authorized web domains (e.g., `https://domaingate.netlify.app`, `http://localhost:8081`) or your mobile app package name and SHA-1 fingerprint.
     - **API restrictions**: Restrict key usage strictly to Firebase Authentication and Cloud Firestore APIs.

---

## 3. Confidential Secrets That Must NEVER Be Exposed

The following credentials have root-level or privileged access and **must never be present in the client codebase, bundle, or Git repository**:

### A. Firebase Admin SDK Private Keys (`serviceAccountKey.json`)
- **Risk**: Grants full root administrative privileges to Firestore, Auth, and Storage, completely bypassing all security rules.
- **Remediation**: Use only on trusted backend microservices or Cloud Functions. Keep `*serviceAccount*.json` and `firebase-adminsdk*.json` in `.gitignore`.

### B. Google OAuth Client Secrets
- **Risk**: Allows server-side OAuth exchange and impersonation.
- **Remediation**: Mobile apps and Single Page Applications (SPAs) use **OAuth 2.0 PKCE (Proof Key for Code Exchange)** or implicit identity token exchange, which do not require a client secret.

---

## 4. Local Development Setup

1. Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the `EXPO_PUBLIC_` variables with values from your Firebase Console:
   - Go to **Firebase Console** > **Project Settings** > **General** > **Your apps** > **Web app**.
   - Copy the `firebaseConfig` object values into `.env`.
3. Verify that Git ignores your `.env` file:
   ```bash
   git status
   ```
   `.env` must **not** appear in untracked files or staged changes.

---

## 5. Deployment Environment Configuration

### Netlify (Web Deployment)
When deploying to Netlify:
1. Navigate to **Site settings** > **Environment variables**.
2. Add each `EXPO_PUBLIC_*` variable matching your `.env.example`.
3. Trigger a production build with `npx expo export --platform web`.

### EAS Build (Android & iOS Native Deployment)
When building with Expo Application Services (EAS):
1. Store values as EAS Secrets:
   ```bash
   eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value <your_key> --type string
   ```
2. Or configure them within `eas.json` under your build profile `env` block for non-sensitive public configuration.
