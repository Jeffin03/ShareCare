import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
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
  const user = credential.user;
  const uid = user.uid;

  const userData = {
    name,
    email,
    role,           // 'patient' | 'pharmacy'
    createdAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "users", uid), userData);
    return user;
  } catch (error) {
    // If Firestore write fails, clean up the auth user to prevent orphaned accounts
    await user.delete().catch(console.error);
    throw error;
  }
}


// ── Log In ────────────────────────────────────────────────────────────────────
export async function logIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}


// ── Reset Password ────────────────────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
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
  // Guard against concurrent calls from the form handler and the auth listener
  if (window.__isRedirecting) return;
  window.__isRedirecting = true;

  const intended = sessionStorage.getItem("redirectAfterLogin");
  sessionStorage.removeItem("redirectAfterLogin");

  // Only honour the stored intent if it is not a role-restricted page that
  // conflicts with the user's role. A pharmacy user should never be sent to
  // a /patient/ page, and a patient should never be sent to /pharmacy/.
  const isPatientOnlyPath  = intended && intended.startsWith("/patient/");
  const isPharmacyOnlyPath = intended && intended.startsWith("/pharmacy/");
  const intentConflicts    = (role === "pharmacy" && isPatientOnlyPath)
                          || (role !== "pharmacy"  && isPharmacyOnlyPath);

  if (intended && !intentConflicts) {
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