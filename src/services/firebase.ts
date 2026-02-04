import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase Configuration
// You can get this from Firebase Console -> Project Settings -> General -> Your Apps -> SDK Setup and Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAM15B3nDejtmbpFTIyYq47ospiYPoHcao",
    authDomain: "health-tracker-app-1cc9d.firebaseapp.com",
    projectId: "health-tracker-app-1cc9d",
    storageBucket: "health-tracker-app-1cc9d.firebasestorage.app",
    messagingSenderId: "791016748405",
    appId: "1:791016748405:web:78ba62d7d1f97aa468cf3c",
    measurementId: "G-TYL51EYL7H"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
