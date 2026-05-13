import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyC0WXfc8DX1dgRpoMC8cI4kFy3R9THrIKc",
    authDomain: "invisiphone-9358e.firebaseapp.com",
    databaseURL: "https://invisiphone-9358e-default-rtdb.firebaseio.com",
    projectId: "invisiphone-9358e",
    storageBucket: "invisiphone-9358e.firebasestorage.app",
    messagingSenderId: "664158025916",
    appId: "1:664158025916:web:f12c66839f0345b718f8b9",
};

// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db };