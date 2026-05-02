import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ── Sign Up ───────────────────────────────────────────────────────────────────
export async function signUp(name, email, password, role) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const userData = {
    name,
    email,
    role,           // 'patient' | 'pharmacy'
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", uid), userData);
  return credential.user;
}


// ── Log In ────────────────────────────────────────────────────────────────────
export async function logIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}


// ── Log Out ───────────────────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
  window.location.href = "/index.html";
}


// ── Get current user's Firestore profile ──────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("User profile not found");
  return { uid, ...snap.data() };
}


// ── Redirect after login based on role + stored intent ───────────────────────
export function redirectAfterLogin(role) {
  const intended = sessionStorage.getItem("redirectAfterLogin");
  sessionStorage.removeItem("redirectAfterLogin");

  if (intended) {
    window.location.href = intended;
    return;
  }

  if (role === "pharmacy") {
    window.location.href = "/pharmacy/dashboard.html";
  } else {
    window.location.href = "/patient/dashboard.html";
  }
}


// ── Guard: require auth on protected pages ────────────────────────────────────
// Call this at the top of every protected page's script
// It will redirect to login if the user is not signed in
export function requireAuth(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "/auth/login.html";
      return;
    }
    const profile = await getUserProfile(user.uid);
    onReady(profile);
  });
}


// ── Guard: redirect away if already logged in ─────────────────────────────────
// Call this on login/signup pages so logged-in users don't see them
export function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    redirectAfterLogin(profile.role);
  });
}

export { auth };