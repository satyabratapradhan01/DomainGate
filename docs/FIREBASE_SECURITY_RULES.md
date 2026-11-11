# DomainGate - Firebase Security Rules & Zero-Trust Data Architecture

This document specifies the server-side security policies enforced at the data layer for DomainGate.

In accordance with enterprise zero-trust directives, client-side domain checks alone are never trusted to guard protected data. The database and storage infrastructure enforce domain verification at the protocol level.

---

## 1. Cloud Firestore Security Rules (`firebase/firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Validates that the caller has a verified email ending strictly with @hbplus.fit
    function isHBPlusAuthorized() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email.matches('.*@hbplus[.]fit$');
    }

    // Helper: Validates user ownership
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Default Deny: All unmatched collections are locked
    match /{document=**} {
      allow read, write: if false;
    }

    // Corporate Workspaces: Accessible only to verified @hbplus.fit accounts
    match /workspaces/{workspaceId} {
      allow read: if isHBPlusAuthorized();
      allow write: if isHBPlusAuthorized() && request.auth.token.role == 'admin';
    }

    // User Profile Documents: Users can read/write their own profile
    match /users/{userId} {
      allow read: if isHBPlusAuthorized();
      allow write: if isHBPlusAuthorized() && isOwner(userId);
    }

    // Enterprise Audit Logs: Append-only immutable log for verified members
    match /security_audits/{auditId} {
      allow create: if isHBPlusAuthorized();
      allow read: if isHBPlusAuthorized();
      allow update, delete: if false; // Immutable audit log
    }
  }
}
```

---

## 2. Cloud Storage Security Rules (`firebase/storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isHBPlusAuthorized() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email.matches('.*@hbplus[.]fit$');
    }

    // Default Deny
    match /{allPaths=**} {
      allow read, write: if false;
    }

    // Corporate Assets Vault
    match /corporate-vault/{fileName} {
      allow read: if isHBPlusAuthorized();
      allow write: if isHBPlusAuthorized() && request.auth.token.role == 'admin';
    }

    // User Avatars
    match /avatars/{userId}/{fileName} {
      allow read: if isHBPlusAuthorized();
      allow write: if isHBPlusAuthorized() && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Firebase Authentication Blocking Functions (`firebase/functions/index.js`)

Deployed on Google Cloud Identity Platform, these serverless triggers intercept authentication events **synchronously** on Google's servers before an account or ID token is minted:

1. **`beforeUserCreated`**:
   - Triggers when a user signs in for the first time with Google OAuth.
   - Evaluates:
     - `event.data.emailVerified === true`
     - `event.data.email.toLowerCase().endsWith('@hbplus.fit')`
   - If invalid, throws `HttpsError('permission-denied', 'Unauthorized domain: DomainGate permits only verified @hbplus.fit accounts.')`.
   - Halts account creation at the identity provider level.
2. **`beforeUserSignedIn`**:
   - Triggers on every subsequent token refresh or sign-in.
   - Prevents stale token bypasses or accounts whose domain access was revoked.
   - Stamped Custom Claims: `{ authorizedDomain: 'hbplus.fit', hbplusVerified: true }`.

---

## 4. Deploying Security Rules & Functions

```bash
# 1. Deploy Firestore Security Rules
firebase deploy --only firestore:rules

# 2. Deploy Storage Security Rules
firebase deploy --only storage:rules

# 3. Deploy Cloud Blocking Functions
firebase deploy --only functions
```
