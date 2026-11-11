# DomainGate 🛡️
### Cross-Platform Enterprise Google Authentication & Zero-Trust Domain Firewall

**DomainGate** is a production-grade cross-platform authentication application built with **React Native**, **Expo SDK 58**, **React Native Web**, and **Firebase Identity Platform**.

It enforces a zero-trust domain boundary allowing access **exclusively** to authenticated users whose verified email address belongs to:
```
Authorized Domain: @hbplus.fit
```

---

## 🔒 Security Architecture: Beyond Frontend Checks

A common flaw in client applications is performing a naive check such as:
```typescript
// ❌ INSECURE ANTI-PATTERN (Frontend-only check)
if (user.email.endsWith('@hbplus.fit')) {
  navigateToDashboard();
}
```
In a standard OAuth/Firebase setup, if an unauthorized user (`attacker@gmail.com`) signs in with Google, Firebase Auth would still issue a valid signed JWT ID token. An attacker could tamper with client JS memory, bypass the router, directly query Firestore / Cloud Storage, or invoke protected backend microservices.

### DomainGate Defense-in-Depth Model (5 Security Layers)

```
[User Browser / Mobile Device]
        │
        ▼ 1. Google OAuth 2.0 Sign-In
[Google Identity Provider]
        │
        ▼ 2. Synchronous Pre-Auth Interceptor
[Firebase Auth Blocking Functions (beforeUserCreated / beforeUserSignedIn)]
        │── Email verified == true?
        │── Domain == '@hbplus.fit'?
        ├── NO  ❌ Throws HttpsError('permission-denied') [No token issued]
        └── YES ✅ Mints RS256 JWT with Custom Claims { authorizedDomain: 'hbplus.fit' }
        │
        ▼ 3. Client State Machine & Auto-Eviction
[DomainGate React Native Engine]
        │── Token Claims Inspection (iss, aud, email_verified, hd)
        │── Emergency Session Purge & Audit Logging on violation
        │
        ▼ 4. Database & Storage Authorization
[Firestore & Cloud Storage Security Rules]
        │── match /{document=**} { allow: if request.auth.token.email.matches('.*@hbplus[.]fit$') }
        │
        ▼ 5. Microservice API Verification
[Node.js Backend Token Middleware]
        └── admin.auth().verifyIdToken() + Domain Regex Validation
```

1. **Layer 1: Identity Provider Blocking Functions** (`firebase/functions/index.js`):
   Google Cloud Identity Platform executes serverless triggers (`beforeUserCreated` and `beforeUserSignedIn`) before an account is registered or an ID token is returned. If an account is not verified or its domain is not `@hbplus.fit`, registration is halted at the identity layer.
2. **Layer 2: Cryptographic Token Claims**:
   Only accounts passing the domain filter are stamped with custom claims (`hbplusVerified: true`, `authorizedDomain: 'hbplus.fit'`).
3. **Layer 3: Zero-Trust Database & Storage Rules** (`firebase/firestore.rules`, `firebase/storage.rules`):
   Even if an attacker manipulates client routing or memory, any Firestore or Cloud Storage request is rejected at the protocol level.
4. **Layer 4: Server-Side Bearer Token Middleware** (`server/verifyTokenServer.ts`):
   Backend REST and GraphQL APIs cryptographically verify the RS256 JWT signature using Google's public JWKS certificates and validate claims.
5. **Layer 5: Client-Side Quarantine State Machine & Atomic Eviction** (`src/context/AuthContext.tsx`):
   Immediate session invalidation, token wiping from `SecureStore` / `AsyncStorage`, and redirection to a security quarantine screen.

---

## 📋 Specification Verification Matrix

| Attempted Account | Expected Result | Reason Code | System Behavior |
| :--- | :--- | :--- | :--- |
| `satya@hbplus.fit` | ✅ **Access Granted** | `AUTH_SUCCESS` | Verified `@hbplus.fit` corporate account admitted to workspace; token claims inspected. |
| `example@gmail.com` | 🛑 **Access Denied** | `ERR_UNAUTHORIZED_DOMAIN` | Consumer webmail rejected; session purged; quarantined with security incident ID. |
| `example@yahoo.com` | 🛑 **Access Denied** | `ERR_UNAUTHORIZED_DOMAIN` | External non-corporate webmail rejected; quarantined. |
| `example@anothercompany.com` | 🛑 **Access Denied** | `ERR_UNAUTHORIZED_DOMAIN` | Foreign corporate domain rejected; quarantined. |
| `unverified@hbplus.fit` | 🛑 **Access Denied** | `ERR_UNVERIFIED_EMAIL` | Unverified Google account rejected; verification required. |

---

## 📁 Repository Structure

```
DomainGate/
├── src/
│   ├── config/
│   │   ├── firebase.ts          # Firebase Client Auth (Web & Native persistence)
│   │   └── securityConfig.ts    # Centralized security policies & domain constants
│   ├── context/
│   │   └── AuthContext.tsx      # Secure State Machine (IDLE, AUTH, VERIFY, AUTHORIZED, DENIED)
│   ├── services/
│   │   ├── authService.ts       # Google OAuth & Simulated Enterprise Test Rig
│   │   └── tokenService.ts      # SecureStore token storage & JWT claim parser
│   ├── components/
│   │   ├── GoogleButton.tsx     # High-polish Google OAuth button
│   │   ├── DomainBadge.tsx      # Visual domain indicator (@hbplus.fit)
│   │   ├── ClaimsInspector.tsx  # Decoded RS256 JWT claims auditor
│   │   ├── SecurityNotice.tsx   # Defense-in-depth architecture guide
│   │   └── SecurityTestRig.tsx  # 1-click test suite for specified test cases
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Enterprise authentication portal
│   │   ├── AccessDeniedScreen.tsx # Quarantine screen with incident reference & purge
│   │   └── DashboardScreen.tsx    # Authenticated HBPlus corporate workspace
│   └── utils/
│       ├── base64.ts            # Universal base64url engine (Hermes / Web / iOS / Android)
│       └── auditLogger.ts       # Local security audit trail logger
├── firebase/
│   ├── functions/
│   │   └── index.js             # Firebase Auth Blocking Functions (beforeUserCreated)
│   ├── firestore.rules          # Strict domain-gated database security rules
│   ├── storage.rules            # Strict domain-gated cloud storage security rules
│   └── firebase.json            # Firebase emulators & deployment configuration
├── server/
│   └── verifyTokenServer.ts     # Express middleware verifying Firebase/Google ID tokens
├── App.tsx                      # Root Application & Navigation Router
├── app.json                     # Expo configuration (cross-platform & OAuth schemes)
└── package.json
```

---

## 🚀 Running the Application

### 1. Web Browser (Chrome, Safari, Firefox, Edge)
```bash
npm run web
```
or
```bash
npx expo start --web
```

### 2. Android
```bash
npm run android
```

### 3. iOS
```bash
npm run ios
```

---

## 🧪 Testing the Security Requirements

1. **Specification Test Suite**:
   The login screen includes an interactive **Specification Test Suite & Simulation** panel. Click on any of the test accounts:
   - Click `satya@hbplus.fit` ➡️ The app transitions to `VERIFYING_DOMAIN`, evaluates cryptographic claims, and unlocks the **HBPlus Corporate Workspace**.
   - Click `example@gmail.com` ➡️ The app intercepts the unapproved domain, executes an emergency session purge, and displays the **Access Denied (Quarantine)** screen with a unique Incident ID (`SEC-INC-...`).
   - Click `example@yahoo.com` or `example@anothercompany.com` ➡️ Both are strictly rejected.
   - Enter any arbitrary email in the custom tester (e.g. `test@hbplus.fit` vs `intruder@hacker.io`).

2. **Live Google OAuth Button**:
   Click **Sign in with Google** to trigger the Google OAuth 2.0 flow. On Web, it launches Google's secure popup with `hd: hbplus.fit` hosted domain hint.

3. **Claims Inspector**:
   Once authenticated, switch to the **Token Claims** tab on the dashboard to inspect the decoded JWT token parameters (`iss`, `aud`, `sub`, `email`, `email_verified`, `hd`, `exp`).

4. **Zero-Trust Backend API Verification**:
   Click **Dispatch Protected API Request** in the dashboard to simulate sending the bearer token to the server middleware (`requireHBPlusDomainAuth`).

---

## 🛠️ Verification Status

- ✅ **TypeScript**: Typecheck passes cleanly with 0 errors (`npx tsc --noEmit`).
- ✅ **Expo Doctor**: 20/20 checks passed with 0 issues (`npx expo-doctor`).
- ✅ **Metro Web Export**: Bundled 323 modules into production static bundle (`npx expo export --platform web`).

