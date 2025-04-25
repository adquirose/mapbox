// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG-OK69ylOQVv79NCw1NyfSBTQ2CUU1zQ",
  authDomain: "react-curso-0-expert.firebaseapp.com",
  projectId: "react-curso-0-expert",
  storageBucket: "react-curso-0-expert.appspot.com",
  messagingSenderId: "518067821481",
  appId: "1:518067821481:web:61acad5f92042478a002b8"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp)
export const firebaseDB = getFirestore(firebaseApp)