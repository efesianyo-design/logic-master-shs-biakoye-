import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  getDocs,
  getDocFromServer,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Auth instance
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function logout() {
  return signOut(auth);
}

// Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or connecting in background.');
    }
    return false;
  }
}

// Data synchronization interfaces & helpers
export interface CloudLearnerRecord {
  id: string;
  name: string;
  scores: any[];
  avg: number;
  weak: string[];
  lastSeen: string;
  streak?: number;
  lastLessonDate?: string;
  bestStreak?: number;
  activeApp?: string;
}

/**
 * Save or update a learner's record to the cloud database
 */
export async function syncLearnerToCloud(record: CloudLearnerRecord): Promise<void> {
  const safeId = String(record.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `learners/${safeId}`;
  
  // Ensure we have a user ID (even if anonymous for now, though Google Login is preferred)
  const uid = auth.currentUser?.uid || 'anonymous';

  try {
    const payload = {
      id: safeId,
      name: record.name.slice(0, 100),
      scores: record.scores || [],
      avg: Math.min(100, Math.max(0, record.avg || 0)),
      weak: record.weak || [],
      lastSeen: record.lastSeen || new Date().toISOString(),
      streak: record.streak || 0,
      lastLessonDate: record.lastLessonDate || '',
      bestStreak: record.bestStreak || 0,
      activeApp: record.activeApp || 'Active',
      ownerId: uid
    };
    await setDoc(doc(db, 'learners', safeId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to real-time classroom updates for the Teacher Monitor
 */
export function subscribeToClassroomLearners(
  onUpdate: (learners: CloudLearnerRecord[]) => void
): () => void {
  const learnersCol = collection(db, 'learners');
  try {
    const unsubscribe = onSnapshot(
      learnersCol,
      (snapshot) => {
        const records: CloudLearnerRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CloudLearnerRecord;
          records.push({
            ...data,
            id: docSnap.id
          });
        });
        onUpdate(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'learners');
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'learners');
    return () => {};
  }
}

/**
 * One-time fetch of all learners in classroom
 */
export async function fetchClassroomLearners(): Promise<CloudLearnerRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'learners'));
    const records: CloudLearnerRecord[] = [];
    snapshot.forEach((docSnap) => {
      records.push(docSnap.data() as CloudLearnerRecord);
    });
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'learners');
    return [];
  }
}
