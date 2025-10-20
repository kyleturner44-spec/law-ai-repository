import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALMamVovxKkU_zPJf8DFCr0OFTp9kVJLo",
  authDomain: "ai-use-cases-for-law-students.firebaseapp.com",
  projectId: "ai-use-cases-for-law-students",
  storageBucket: "ai-use-cases-for-law-students.firebasestorage.app",
  messagingSenderId: "472379256705",
  appId: "1:472379256705:web:0547984defe4ed6c2d4280"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);