# DomainGate — Production Firebase Security Rules & Deployment Guide

This document details the production Firestore Security Rules for **DomainGate** and provides step-by-step instructions for deploying and verifying them.

---

## 1. Security Architecture & Threat Model

In DomainGate, client-side route guards and UI state checks are considered the **first line of defense, not the only line of defense**. 

Even if an attacker attempts to:
- Directly query Firestore using Firebase Web SDK in browser developer tools
- Replay an OAuth token from `@gmail.com`, `@yahoo.com`, or `@anothercompany.com`
- Send malicious Firestore `setDoc()` or `updateDoc()` requests tampering with their document `role: "ADMIN"`
- Bypass the React Native router and access deep URLs

The **Cloud Firestore Security Rules** reject the request at the database protocol level with `permission-denied`.

---

## 2. Production Rules Implementation (`firestore.rules`)

The complete production rules file is located at [`firestore.rules`](file:///c:/Users/Vivobook/OneDrive/Desktop/DomainGate/firestore.rules) and [`firebase/firestore.rules`](file:///c:/Users/Vivobook/OneDrive/Desktop/DomainGate/firebase/firestore.rules):

```javascript
rules_version = '2';

/**
 * DomainGate — Enterprise Firestore Security Rules
 * 
 * ZERO-TRUST SECURITY SPECIFICATION:
 * 1. Authentication Required: User must have an active, signed Firebase Auth session.
 * 2. Email Verified: User's email must be verified by Google Identity Provider (email_verified == true).
 * 3. Domain Restricted: User email must belong strictly to @hbplus.fit.
 * 4. Least Privilege / Owner Isolation: Users can only read their own profile (users/{userId})
 *    unless explicitly authorized as an ADMIN.
 * 5. Role Tamper-Proofing: Users CANNOT modify their assigned role.
 * 6. Privilege Escalation Prevention: Users CANNOT grant themselves ADMIN privileges during creation or updates.
 * 7. Default Deny: All unmatched collections and documents are strictly denied.
 * 8. Production Hardened: No test mode rules or date-expiring escape hatches.
 */

service cloud.firestore {
  match /databases/{database}/documents {

    // =========================================================================
    // Core Authorization Functions
    // =========================================================================

    /**
     * 1. Authentication Check:
     * Verifies that the caller has an active authenticated session.
     */
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }

    /**
     * 2. Email Verification Check:
     * Verifies that Google Identity Provider has validated the user's email address.
     */
    function isEmailVerified() {
      return isAuthenticated() && request.auth.token.email_verified == true;
    }

    /**
     * 3. Domain Restriction Check:
     * Verifies that the user email belongs strictly to @hbplus.fit.
     * Denies subdomains, consumer domains (@gmail.com), and third-party domains.
     */
    function hasAuthorizedDomain() {
      return isEmailVerified()
        && request.auth.token.email is string
        && request.auth.token.email.matches('^[a-zA-Z0-9._%+-]+@hbplus[.]fit$');
    }

    /**
     * Composite Gate: Authenticated + Verified + @hbplus.fit domain.
     */
    function isHBPlusAuthorized() {
      return hasAuthorizedDomain();
    }

    /**
     * Owner Isolation: Checks if caller owns the targeted document.
     */
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    /**
     * Administrative Verification:
     * Admin rights are established ONLY via trusted administrative channels:
     * - Firebase Auth Custom Claims (request.auth.token.role == 'ADMIN')
     * - Or an existing Firestore document with role == 'ADMIN'
     */
    function isAdmin() {
      return isHBPlusAuthorized() && (
        request.auth.token.role == 'ADMIN' ||
        request.auth.token.admin == true ||
        (
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
        )
      );
    }

    // =========================================================================
    // Collection Rules: Users (/users/{userId})
    // =========================================================================

    match /users/{userId} {
      // Rule 4: Users can ONLY read their own profile; Admins can read all profiles
      allow read: if isHBPlusAuthorized() && (isOwner(userId) || isAdmin());

      // Rule 6: Users CANNOT grant themselves ADMIN privileges on creation.
      // - Must be creating their own document
      // - Payload role MUST be 'USER'
      allow create: if isHBPlusAuthorized()
                    && isOwner(userId)
                    && request.resource.data.uid == userId
                    && request.resource.data.email == request.auth.token.email
                    && request.resource.data.role == 'USER';

      // Rule 5: Users CANNOT modify their role.
      // - Regular users can update name/photoURL/lastLoginAt, but their 'role' MUST remain unchanged
      // - Only Admins can modify the 'role' field
      allow update: if isHBPlusAuthorized() && (
        (isOwner(userId) && request.resource.data.role == resource.data.role) ||
        isAdmin()
      );

      // Only trusted administrators can delete user records
      allow delete: if isAdmin();
    }

    // =========================================================================
    // Protected Enterprise Collections
    // =========================================================================

    match /workspaces/{workspaceId} {
      allow read: if isHBPlusAuthorized();
      allow write: if isAdmin();
    }

    match /directory/{memberId} {
      allow read: if isHBPlusAuthorized();
      allow write: if isAdmin();
    }

    match /security_audits/{auditId} {
      allow create: if isHBPlusAuthorized();
      allow read: if isAdmin();
      allow update, delete: if false; // Immutable audit log
    }

    // =========================================================================
    // Rule 7 & 8: Default Deny All Unmatched Documents (Production Mode)
    // =========================================================================
    // Unauthorized domains (@gmail.com, @yahoo.com, etc.) cannot read/write any document.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Enforcement Verification Matrix

| Requirement | Implementation in `firestore.rules` | Rejection Trigger |
| :--- | :--- | :--- |
| **1. User must be authenticated** | `request.auth != null && request.auth.uid != null` | Unauthenticated requests receive `403 Forbidden` (`permission-denied`). |
| **2. Email must be verified** | `request.auth.token.email_verified == true` | Unverified accounts cannot read or write user profiles or data. |
| **3. Email must belong to `@hbplus.fit`** | `request.auth.token.email.matches('^[a-zA-Z0-9._%+-]+@hbplus[.]fit$')` | Any account from `@gmail.com`, `@yahoo.com`, or other companies is immediately blocked. |
| **4. Read own profile only (unless Admin)** | `isOwner(userId) \|\| isAdmin()` | User `alice` cannot query `/users/bob`. |
| **5. Users cannot modify their role** | `request.resource.data.role == resource.data.role` | Any payload altering `role` from `'USER'` to `'ADMIN'` is blocked. |
| **6. Cannot self-grant admin on create** | `request.resource.data.role == 'USER'` | Document creation with `role: "ADMIN"` is blocked. |
| **7. Unauthorized domains blocked** | Default rule `allow read, write: if false;` | All external and unauthorized accounts fail all queries. |
| **8. No test mode** | `rules_version = '2'`, zero permissive rules | Eliminates 30-day test-mode expiration vulnerabilities. |

---

## 4. Deployment Instructions

### Method A: Deploy via Firebase CLI (Recommended for Production CI/CD)

#### Step 1: Install Firebase CLI
If not already installed globally:
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Select or Initialize Your Firebase Project
```bash
firebase use --add
# Select your Firebase project (e.g., domaingate-prod)
```
Or set the active project:
```bash
firebase use <YOUR_FIREBASE_PROJECT_ID>
```

#### Step 4: Verify Local Emulator Rules (Optional but Recommended)
Run the rules against the local Firestore emulator:
```bash
firebase emulators:start --only firestore
```

#### Step 5: Deploy the Rules
Deploy exclusively the Firestore rules to your production Firebase project:
```bash
firebase deploy --only firestore:rules
```

**Expected CLI Output:**
```
✔  Deploying firestore:rules...
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

---

### Method B: Manual Deployment via Firebase Console

If you prefer applying the rules directly in the browser:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your DomainGate project.
3. In the left navigation menu, navigate to **Build** > **Firestore Database**.
4. Click on the **Rules** tab at the top.
5. Replace the entire contents of the editor with the rules from [`firestore.rules`](file:///c:/Users/Vivobook/OneDrive/Desktop/DomainGate/firestore.rules).
6. Click the blue **Publish** button in the upper right.
7. Verification: The badge next to the rules should update to **Published** with the current timestamp.

---

## 5. Security Rules Automated Testing

To run unit tests against these security rules locally using `@firebase/rules-unit-testing`:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'domaingate-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// Test 1: @hbplus.fit verified user can create own profile with role 'USER'
test('Permit @hbplus.fit user to create own profile as USER', async () => {
  const aliceContext = testEnv.authenticatedContext('alice_123', {
    email: 'alice@hbplus.fit',
    email_verified: true,
  });
  const db = aliceContext.firestore();
  await assertSucceeds(
    db.collection('users').doc('alice_123').set({
      uid: 'alice_123',
      name: 'Alice Cooper',
      email: 'alice@hbplus.fit',
      role: 'USER',
      organization: 'HBPlus Health & Fitness Global Inc.',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    })
  );
});

// Test 2: User cannot elevate themselves to ADMIN
test('Reject user self-granting ADMIN role', async () => {
  const bobContext = testEnv.authenticatedContext('bob_456', {
    email: 'bob@hbplus.fit',
    email_verified: true,
  });
  const db = bobContext.firestore();
  await assertFails(
    db.collection('users').doc('bob_456').set({
      uid: 'bob_456',
      name: 'Bob Attacker',
      email: 'bob@hbplus.fit',
      role: 'ADMIN', // <-- BLOCKED BY SECURITY RULES
      organization: 'HBPlus Health & Fitness Global Inc.',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    })
  );
});

// Test 3: Unauthorized domain @gmail.com is blocked
test('Reject @gmail.com user from reading or writing', async () => {
  const gmailContext = testEnv.authenticatedContext('intruder_789', {
    email: 'intruder@gmail.com',
    email_verified: true,
  });
  const db = gmailContext.firestore();
  await assertFails(db.collection('users').doc('intruder_789').get());
});

// Test 4: Unverified email is blocked even with @hbplus.fit
test('Reject unverified @hbplus.fit user', async () => {
  const unverifiedContext = testEnv.authenticatedContext('unverified_101', {
    email: 'unverified@hbplus.fit',
    email_verified: false, // <-- BLOCKED
  });
  const db = unverifiedContext.firestore();
  await assertFails(db.collection('users').doc('unverified_101').get());
});
```
