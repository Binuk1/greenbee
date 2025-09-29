// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// Your Firebase configuration (same as ESP32 code)
const firebaseConfig = {
  apiKey: "AIzaSyD5tNhUioXWvytAjUKF6uaKbdPIeCYpSdc",
  databaseURL: "https://greenbee-f80a2-default-rtdb.firebaseio.com/",
  projectId: "greenbee-f80a2",
  storageBucket: "greenbee-f80a2.firebasestorage.app",
  messagingSenderId: "10622875",
  appId: "1:10622875:web:12"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue };