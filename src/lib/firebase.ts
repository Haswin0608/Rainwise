import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import { AuthUser, SavedBuilding, RoofSection } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// In browser/iframe environments, initialize Firestore with long-polling
// to prevent streaming WebChannel connection drops through sandboxed proxy layers.
if (typeof window !== 'undefined') {
  try {
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId || undefined);
  } catch {
    // Already initialized
  }
}

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ═══════════════════════════════════════
// FIRESTORE ERROR HANDLING (SKILL SPEC)
// ═══════════════════════════════════════

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot according to skill guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        (error as { code?: string }).code === 'unavailable' ||
        (error as { code?: string }).code === 'permission-denied')
    ) {
      console.warn('Firestore is connecting or operating in offline mode.');
    }
  }
}
testFirestoreConnection();

export function mapFirebaseUser(user: FirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Friend',
    isAnonymous: user.isAnonymous,
  };
}

export function subscribeToAuth(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    callback(mapFirebaseUser(fbUser));
  });
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const mapped = mapFirebaseUser(result.user);
  if (!mapped) throw new Error('Could not identify signed-in user.');

  // Create or update user profile document
  const userPath = `users/${mapped.uid}`;
  try {
    const userDocRef = doc(db, 'users', mapped.uid);
    await setDoc(
      userDocRef,
      {
        uid: mapped.uid,
        email: mapped.email || '',
        displayName: mapped.displayName || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user profile:', err);
    // Profile save is best effort on login
  }

  return mapped;
}

export async function loginWithEmail(email: string, pass: string): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const mapped = mapFirebaseUser(result.user);
  if (!mapped) throw new Error('Could not identify signed-in user.');
  return mapped;
}

export async function registerWithEmail(email: string, pass: string, name?: string): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name?.trim()) {
    await updateProfile(result.user, { displayName: name.trim() });
  }
  const mapped = mapFirebaseUser(result.user);
  if (!mapped) throw new Error('Could not identify signed-in user.');

  // Create user profile document in Firestore
  const userPath = `users/${mapped.uid}`;
  try {
    const userDocRef = doc(db, 'users', mapped.uid);
    await setDoc(userDocRef, {
      uid: mapped.uid,
      email: mapped.email || '',
      displayName: mapped.displayName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }

  return mapped;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ═══════════════════════════════════════
// FIRESTORE BUILDINGS MANAGEMENT
// ═══════════════════════════════════════

export interface SaveBuildingPayload {
  nickname: string;
  locationLabel?: string;
  roofs: RoofSection[];
  tankCapacity: string;
  efficiency: string;
  dailyRequirement?: string;
}

export async function fetchUserBuildings(userId: string): Promise<SavedBuilding[]> {
  const collectionPath = `users/${userId}/buildings`;
  try {
    const buildingsRef = collection(db, 'users', userId, 'buildings');
    const q = query(buildingsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const list: SavedBuilding[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: data.userId || userId,
        nickname: data.nickname || 'Unnamed Building',
        locationLabel: data.locationLabel || undefined,
        roofs: Array.isArray(data.roofs) ? data.roofs : [],
        tankCapacity: String(data.tankCapacity || '1000'),
        efficiency: String(data.efficiency || '80'),
        dailyRequirement: data.dailyRequirement ? String(data.dailyRequirement) : undefined,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }
}

export async function saveUserBuilding(
  userId: string,
  payload: SaveBuildingPayload,
  existingId?: string
): Promise<SavedBuilding> {
  const buildingId = existingId || `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docPath = `users/${userId}/buildings/${buildingId}`;
  const docRef = doc(db, 'users', userId, 'buildings', buildingId);
  const now = new Date().toISOString();

  const docData: Record<string, any> = {
    id: buildingId,
    userId,
    nickname: payload.nickname.trim(),
    roofs: payload.roofs.map((r, idx) => ({
      id: r.id || `roof_${idx + 1}`,
      name: r.name || `Roof ${idx + 1}`,
      length: String(r.length || '0'),
      width: String(r.width || '0'),
    })),
    tankCapacity: String(payload.tankCapacity || '1000'),
    efficiency: String(payload.efficiency || '80'),
    updatedAt: now,
  };

  if (payload.locationLabel?.trim()) {
    docData.locationLabel = payload.locationLabel.trim();
  }
  if (payload.dailyRequirement && payload.dailyRequirement.trim() !== '') {
    docData.dailyRequirement = payload.dailyRequirement.trim();
  }
  if (!existingId) {
    docData.createdAt = now;
  }

  try {
    await setDoc(docRef, docData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  return {
    id: buildingId,
    userId,
    nickname: payload.nickname.trim(),
    locationLabel: payload.locationLabel?.trim() || undefined,
    roofs: docData.roofs,
    tankCapacity: docData.tankCapacity,
    efficiency: docData.efficiency,
    dailyRequirement: docData.dailyRequirement,
    createdAt: docData.createdAt || now,
    updatedAt: now,
  };
}

export async function removeUserBuilding(userId: string, buildingId: string): Promise<void> {
  const docPath = `users/${userId}/buildings/${buildingId}`;
  const docRef = doc(db, 'users', userId, 'buildings', buildingId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// Aliases for convenience
export const getUserBuildings = fetchUserBuildings;
export const deleteUserBuilding = removeUserBuilding;

