import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth & Firestore with specific database ID if present
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const linkedinProvider = new OAuthProvider('oidc.linkedin');

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  createdAt?: any;
  lastLogin?: any;
}

// Save or sync user profile in Firestore
export const syncUserProfile = async (user: User, providerName: string = 'email') => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const profileData: UserProfileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
      photoURL: user.photoURL || null,
      provider: providerName,
      lastLogin: new Date().toISOString()
    };
    if (!snap.exists()) {
      profileData.createdAt = new Date().toISOString();
      await setDoc(userRef, profileData);
    } else {
      await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
    }
  } catch (e) {
    console.error('Erreur lors de la synchronisation du profil Firestore :', e);
  }
};

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup, 
  firebaseSignOut,
  onAuthStateChanged 
};
