import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let currentConfigStr = "";

export function getFirebaseApp(configJsonStr) {
  if (!configJsonStr) return null;
  if (firebaseApp && currentConfigStr === configJsonStr) {
    return firebaseApp;
  }
  
  try {
    const config = JSON.parse(configJsonStr);
    if (!config.apiKey || !config.projectId) {
      throw new Error("Invalid config format: missing apiKey or projectId.");
    }
    
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = apps[0];
    } else {
      firebaseApp = initializeApp(config);
    }
    
    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    currentConfigStr = configJsonStr;
    console.log("[Firebase] Successfully initialized cloud services.");
    return firebaseApp;
  } catch (err) {
    console.error("[Firebase] Initialization error: ", err);
    return null;
  }
}

export function getFirebaseDb(configJsonStr) {
  getFirebaseApp(configJsonStr);
  return firestoreDb;
}

export function getFirebaseAuth(configJsonStr) {
  getFirebaseApp(configJsonStr);
  return firebaseAuth;
}

export async function signUpWithEmail(configJsonStr, email, password) {
  const auth = getFirebaseAuth(configJsonStr);
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithEmail(configJsonStr, email, password) {
  const auth = getFirebaseAuth(configJsonStr);
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOutUser(configJsonStr) {
  const auth = getFirebaseAuth(configJsonStr);
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuthChanges(configJsonStr, callback) {
  const auth = getFirebaseAuth(configJsonStr);
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function saveToCloud(configJsonStr, collection, docId, data) {
  const db = getFirebaseDb(configJsonStr);
  if (!db) return false;
  
  try {
    const docRef = doc(db, collection, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Cloud Sync] Failed to save: ", err);
    return false;
  }
}

export async function loadFromCloud(configJsonStr, collection, docId) {
  const db = getFirebaseDb(configJsonStr);
  if (!db) return null;
  
  try {
    const docRef = doc(db, collection, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error("[Firebase Cloud Sync] Failed to load: ", err);
    return null;
  }
}
