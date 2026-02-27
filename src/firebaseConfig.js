// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAIcm_QvHNm0AFnzmHyqBEWRPuXsxns-UA",
    authDomain: "backery-web-app.firebaseapp.com",
    projectId: "backery-web-app",
    storageBucket: "backery-web-app.firebasestorage.app",
    messagingSenderId: "350989556019",
    appId: "1:350989556019:web:a597a1a94301ff28d0c646",
    measurementId: "G-DM30JGLLKX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);