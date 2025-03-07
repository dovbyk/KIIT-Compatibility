import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, sendEmailVerification, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDbvhMead4EtiK4IDTzjCwnEnslPm0Wpm4",
  authDomain: "compapp-f0f89.firebaseapp.com",
  projectId: "compapp-f0f89",
  storageBucket: "compapp-f0f89.firebasestorage.app",
  messagingSenderId: "836272832264",
  appId: "1:836272832264:web:5d5703058857e7c6bfb6bd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber, sendEmailVerification, signInAnonymously };
