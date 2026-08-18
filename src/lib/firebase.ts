import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Config is read from Vite env vars (see .env.example). These values are not
// secret — Firebase security rules are what protect the data.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Local development against the Firebase emulators. Gated on DEV so a production
// build never connects to them, even if the flag lingers in an env file. Uses
// the current hostname so a phone on the LAN reaches the emulator on this
// machine (start the emulators bound to 0.0.0.0 — see firebase.json).
if (import.meta.env.DEV && import.meta.env.VITE_USE_AUTH_EMULATOR === 'true') {
  const host = window.location.hostname
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, 8080)
}
