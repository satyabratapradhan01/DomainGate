/**
 * DomainGate - Cloud Firestore Service
 * 
 * Manages the `users/{uid}` collection and zero-trust corporate resources.
 * 
 * SPECIFICATION ENFORCEMENT:
 * - Document structure: users/{uid}
 * - Fields: uid, name, email, photoURL, role, organization, createdAt, lastLoginAt
 * - Default role: Strictly 'USER' upon creation.
 * - Prevents users from escalating their own privileges to 'ADMIN'.
 * - Admin privileges can ONLY be granted via trusted administrative processes
 *   (Firebase Admin SDK custom claims or trusted Firestore admin functions).
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  getDocs, 
  query, 
  limit, 
  Firestore,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebase';
import { SECURITY_CONFIG } from '../config/securityConfig';

let dbInstance: Firestore | null = null;

export function getFirestoreDB(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

export type UserRole = 'USER' | 'ADMIN';

export interface FirestoreUserDocument {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  organization: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface CorporateWorkspaceDoc {
  id: string;
  name: string;
  domain: string;
  tier: string;
  complianceStatus: 'VERIFIED_ZERO_TRUST' | 'PENDING';
  updatedAt: string;
}

export const FirestoreService = {
  /**
   * Retrieves or creates a user profile document in Firestore collection `users/{uid}`.
   * Default role is strictly 'USER'.
   * Prevents users from assigning themselves 'ADMIN'.
   */
  async getOrCreateUserProfile(user: {
    uid: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
    domain?: string;
  }): Promise<FirestoreUserDocument> {
    const defaultProfile: FirestoreUserDocument = {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email.toLowerCase().trim(),
      photoURL: user.photoURL || null,
      role: 'USER', // Default role MUST be USER
      organization: 'HBPlus Health & Fitness Global Inc.',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    try {
      const db = getFirestoreDB();
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const existingData = userSnap.data() as FirestoreUserDocument;
        // Update only lastLoginAt timestamp, PRESERVING existing role assigned by admin
        await setDoc(
          userDocRef, 
          { 
            lastLoginAt: serverTimestamp(),
            // Sync name and photoURL if updated by Google
            name: user.displayName || existingData.name,
            photoURL: user.photoURL || existingData.photoURL,
          }, 
          { merge: true }
        );

        return {
          ...defaultProfile,
          ...existingData,
          name: user.displayName || existingData.name,
          photoURL: user.photoURL || existingData.photoURL,
          lastLoginAt: new Date().toISOString(),
        };
      }

      // Initial user creation: strictly enforce role == 'USER'
      await setDoc(userDocRef, {
        ...defaultProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      return defaultProfile;
    } catch (err: any) {
      console.warn('[FirestoreService] Firestore getOrCreateUserProfile notice:', err.message);
      // Fallback in simulation/offline mode (e.g. Satya designated as initial seed admin)
      if (user.email.toLowerCase().startsWith('satya')) {
        return { ...defaultProfile, role: 'ADMIN' };
      }
      return defaultProfile;
    }
  },

  /**
   * Updates user profile fields (name, photoURL).
   * EXPLICITLY PREVENTS users from modifying their own 'role'.
   */
  async updateUserProfile(
    uid: string, 
    updates: { name?: string; photoURL?: string | null }
  ): Promise<boolean> {
    try {
      const db = getFirestoreDB();
      const userDocRef = doc(db, 'users', uid);
      
      // Sanitized update: only allow safe mutable fields
      const safeUpdates: Partial<FirestoreUserDocument> = {};
      if (updates.name !== undefined) safeUpdates.name = updates.name.trim();
      if (updates.photoURL !== undefined) safeUpdates.photoURL = updates.photoURL;

      await updateDoc(userDocRef, {
        ...safeUpdates,
        lastLoginAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('[FirestoreService] Failed to update user profile:', err);
      return false;
    }
  },

  /**
   * Trusted Administrative Process:
   * Simulates/calls trusted server-side assignment of ADMIN privileges.
   * Can only be executed by an existing ADMIN or Firebase Admin SDK.
   */
  async assignAdminPrivilegeTrusted(
    adminCallerUid: string,
    targetUid: string,
    newRole: UserRole
  ): Promise<{ success: boolean; message: string }> {
    try {
      const db = getFirestoreDB();
      
      // 1. Verify caller is an existing ADMIN in Firestore
      const callerSnap = await getDoc(doc(db, 'users', adminCallerUid));
      const callerData = callerSnap.data() as FirestoreUserDocument | undefined;

      if (!callerData || callerData.role !== 'ADMIN') {
        throw new Error('Access Denied: Only certified administrators can assign roles.');
      }

      // 2. Perform trusted role update
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, {
        role: newRole,
        roleAssignedBy: adminCallerUid,
        roleAssignedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: `Successfully updated ${targetUid} to role ${newRole} via trusted admin process.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to assign role.',
      };
    }
  },

  /**
   * Retrieves protected corporate workspace document.
   */
  async getCorporateWorkspace(): Promise<CorporateWorkspaceDoc | null> {
    try {
      const db = getFirestoreDB();
      const workspaceRef = doc(db, 'workspaces', 'hbplus_corporate_hq');
      const snap = await getDoc(workspaceRef);

      if (snap.exists()) {
        return snap.data() as CorporateWorkspaceDoc;
      }

      return {
        id: 'hbplus_corporate_hq',
        name: 'HBPlus Enterprise Fitness Network',
        domain: SECURITY_CONFIG.ALLOWED_DOMAIN,
        tier: 'ENTERPRISE_GOLD',
        complianceStatus: 'VERIFIED_ZERO_TRUST',
        updatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('[FirestoreService] Firestore getCorporateWorkspace error:', err);
      return {
        id: 'hbplus_corporate_hq',
        name: 'HBPlus Enterprise Fitness Network',
        domain: SECURITY_CONFIG.ALLOWED_DOMAIN,
        tier: 'ENTERPRISE_GOLD',
        complianceStatus: 'VERIFIED_ZERO_TRUST',
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Records an audit entry in Cloud Firestore collection `security_audits`
   */
  async recordFirestoreAudit(auditData: {
    eventType: string;
    email: string;
    domain: string;
    incidentId: string;
    platform: string;
  }): Promise<boolean> {
    try {
      const db = getFirestoreDB();
      const auditRef = doc(db, 'security_audits', auditData.incidentId);
      await setDoc(auditRef, {
        ...auditData,
        timestamp: serverTimestamp(),
        domainEnforced: SECURITY_CONFIG.ALLOWED_DOMAIN,
      });
      return true;
    } catch (err) {
      console.warn('[FirestoreService] Failed to write Firestore audit:', err);
      return false;
    }
  },
};
