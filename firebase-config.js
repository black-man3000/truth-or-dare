/* ==========================================================
   FIREBASE CONFIG
   ----------------------------------------------------------
   This connects the app to your Firebase project. The apiKey
   here is safe to be public — Firebase apps are secured by
   Firestore Security Rules (see firestore.rules.txt), not by
   hiding this key.
   ========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAvVdRTf2CLyGVWTsjEwePrJhkbLeCIMe4",
  authDomain: "truth-or-dare-a94af.firebaseapp.com",
  projectId: "truth-or-dare-a94af",
  storageBucket: "truth-or-dare-a94af.firebasestorage.app",
  messagingSenderId: "181041366106",
  appId: "1:181041366106:web:a9c044f7fd3e1512ca8463"
};

export const firebaseApp = initializeApp(firebaseConfig);
