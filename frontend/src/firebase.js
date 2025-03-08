import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDbvhMead4EtiK4IDTzjCwnEnslPm0Wpm4",
  authDomain: "compapp-f0f89.firebaseapp.com",
  projectId: "compapp-f0f89",
  storageBucket: "compapp-f0f89.firebasestorage.app",
  messagingSenderId: "836272832264",
  appId: "1:836272832264:web:5d5703058857e7c6bfb6bd"
};

firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export { RecaptchaVerifier, signInWithPhoneNumber };
