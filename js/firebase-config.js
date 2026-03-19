import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const cfg = window.__env;

const firebaseConfig = {
  apiKey:            cfg.FIREBASE_API_KEY,
  authDomain:        cfg.FIREBASE_AUTH_DOMAIN,
  projectId:         cfg.FIREBASE_PROJECT_ID,
  messagingSenderId: cfg.FIREBASE_MESSAGING_SENDER_ID,
  appId:             cfg.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
