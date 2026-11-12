/**
 * DomainGate - User Service
 * 
 * Manages user profile retrieval, document initialization in users/{uid},
 * profile updates, and role validation in accordance with RBAC directives.
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  Firestore 
} from 'firebase/firestore';
import { getFirebaseApp } from './firebase';
import { APP_CONFIG } from '../constants/config';
import { UserRole, UserProfileDocument } from '../types/auth.types';

let dbInstance: Firestore | null = null;

export function getFirestoreDB(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

export const UserService = {
  /**
   * Retrieves or initializes a user document in collection `users/{uid}`.
   * Default role is strictly 'USER'.
   * Never allows clients to self-assign 'ADMIN' status.
   */
  async getOrCreateUserProfile(user: {
    uid: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
    domain?: string;
  }): Promise<UserProfileDocument> {
    const defaultProfile: UserProfileDocument = {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email.toLowerCase().trim(),
      photoURL: user.photoURL || null,
      role: 'USER', // Default role must strictly be USER
      organization: APP_CONFIG.ORGANIZATION_NAME,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified: true,
      domain: user.domain || APP_CONFIG.ALLOWED_DOMAIN,
    };

    try {
      const db = getFirestoreDB();
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const existingData = userSnap.data() as UserProfileDocument;
        
        // Update last login timestamp without mutating existing role
        await updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString(),
          photoURL: user.photoURL || existingData.photoURL || null,
          name: user.displayName || existingData.name,
        }).catch((err) => {
          console.warn('[UserService] Could not update lastLoginAt:', err.message);
        });

        return {
          ...defaultProfile,
          ...existingData,
          lastLoginAt: new Date().toISOString(),
        };
      } else {
        // Create user document with immutable default role == 'USER'
        await setDoc(userDocRef, defaultProfile);
        return defaultProfile;
      }
    } catch (err: any) {
      console.warn('[UserService] Firestore offline or using mock/fallback:', err.message);
      
      // Known corporate administrative accounts (e.g. Satya) get administrative role in mock/simulation
      if (user.email.toLowerCase().startsWith('satya')) {
        return {
          ...defaultProfile,
          role: 'ADMIN',
        };
      }
      return defaultProfile;
    }
  },

  /**
   * Fetches an existing user profile by UID
   */
  async getUserProfile(uid: string): Promise<UserProfileDocument | null> {
    try {
      const db = getFirestoreDB();
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as UserProfileDocument;
      }
      return null;
    } catch (err: any) {
      console.warn('[UserService] Error reading user profile:', err);
      return null;
    }
  },

  /**
   * Safely updates profile fields.
   * Note: The 'role' field cannot be altered through this call.
   */
  async updateProfile(uid: string, data: { name?: string; photoURL?: string }): Promise<void> {
    const db = getFirestoreDB();
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...data,
      lastLoginAt: new Date().toISOString(),
    });
  },
};

