import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEGWqYzHYXzieMbAeIQlq5StcmwIC2zGI",
  authDomain: "schedulerapp-8c6ee.firebaseapp.com",
  projectId: "schedulerapp-8c6ee",
  storageBucket: "schedulerapp-8c6ee.firebasestorage.app",
  messagingSenderId: "727245937725",
  appId: "1:727245937725:android:c6c635013738dd2718de54"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});