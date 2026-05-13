import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // <-- Solo este import de auth va aquí

const firebaseConfig = {
  apiKey: "AIzaSyCbUpEbH0qofLL4h8-C2UqBpHrD47aj0L4", 
  authDomain: "prueba-80fb1.firebaseapp.com",
  projectId: "prueba-80fb1",
  storageBucket: "prueba-80fb1.firebasestorage.app",
  messagingSenderId: "42524196385",
  appId: "1:42524196385:web:8b2dc1802f621e1c4bed60"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);