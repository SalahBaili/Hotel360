import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVPwphrwkrq0UJBeDJwVIIk-SNk26_Umw",
  authDomain: "examen-64eb4.firebaseapp.com",
  projectId: "examen-64eb4",
  storageBucket: "examen-64eb4.firebasestorage.app",
  messagingSenderId: "207786683978",
  appId: "1:207786683978:web:8b3c756fa1e633e2d180b3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);