import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXfSrLRcV-ru2mgSTvmSf6J2vZLVW6wuE",
  authDomain: "vms-orcamentos.firebaseapp.com",
  projectId: "vms-orcamentos",
  storageBucket: "vms-orcamentos.firebasestorage.app",
  messagingSenderId: "345714687382",
  appId: "1:345714687382:web:60bf01eacc57064ee671b7",
};

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase inicializado');
} catch (error) {
  console.error('Firebase não disponível:', error);
}

export { db, app };
