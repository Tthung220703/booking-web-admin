import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Thêm Firebase Storage

const firebaseConfig = {
    apiKey: "AIzaSyC2BsauiVgQcP3lyhKi_wunCXk8G1em6Ks",
    authDomain: "bking-e4fb6.firebaseapp.com",
    projectId: "bking-e4fb6",
    storageBucket: "bking-e4fb6.firebasestorage.app",
    messagingSenderId: "306815886448",
    appId: "1:306815886448:web:4fc72a31d48456030280b5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Thêm Firebase Storage vào xuất khẩu

export { db, auth, storage  };