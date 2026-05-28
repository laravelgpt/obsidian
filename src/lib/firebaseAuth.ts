import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Google OAuth Provider with explicit scopes
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/docs");
provider.addScope("https://www.googleapis.com/auth/chat");

// Flag to track signing in state
let isSigningIn = false;

// Token caching in memory (avoid localStorage for accessToken security)
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
}

// Global subscribers for token updates
type AuthCallback = (session: AuthSession) => void;
const subscribers = new Set<AuthCallback>();

export const subscribeToAuth = (callback: AuthCallback) => {
  subscribers.add(callback);
  // Initial fire
  callback({ user: auth.currentUser, accessToken: cachedAccessToken });
  return () => {
    subscribers.delete(callback);
  };
};

const notifySubscribers = () => {
  const session: AuthSession = {
    user: auth.currentUser,
    accessToken: cachedAccessToken,
  };
  subscribers.forEach((cb) => cb(session));
};

// Monitor security auth changes
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedIdToken = null;
  }
  notifySubscribers();
});

/**
 * Handle Google Popup Sign-in
 */
export const googleSignIn = async (): Promise<AuthSession> => {
  if (isSigningIn) {
    throw new Error("Sign-in process is already active. Please finish or cancel the current prompt.");
  }
  
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("No Google Access Token was obtained from Firebase Auth.");
    }
    
    cachedAccessToken = credential.accessToken;
    notifySubscribers();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Firebase Signin Popup Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Log out user of session
 */
export const googleSignOut = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedIdToken = null;
  notifySubscribers();
};

/**
 * Retrieve cached token
 */
export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};
