import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ── Fallback demo pharmacies (used when Firestore collection is empty) ────────
const DEMO_PHARMACIES = [
  { id: 'demo-1', name: 'Apollo Pharmacy',      area: 'Koramangala', address: '5th Block, Koramangala',     phone: '080-41234567' },
  { id: 'demo-2', name: 'MedPlus',              area: 'Indiranagar',  address: '100 Feet Road, Indiranagar', phone: '080-41234568' },
  { id: 'demo-3', name: 'Fortis Health Centre', area: 'Bannerghatta', address: 'Bannerghatta Road',          phone: '080-41234569' },
  { id: 'demo-4', name: 'Wellness Forever',     area: 'HSR Layout',   address: 'Sector 2, HSR Layout',       phone: '080-41234570' },
];

// ── Fetch all pharmacies (falls back to demo list if Firestore is empty) ──────
export async function getPharmacies() {
  const snap = await getDocs(collection(db, "pharmacies"));
  if (!snap.empty) {
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  // Firestore empty — return demo pharmacies so the form is always usable
  return DEMO_PHARMACIES;
}


// ── Submit a new medicine request ─────────────────────────────────────────────
export async function submitRequest(patientId, pharmacyId, medicines, notes, preferredPickupTime) {
  const ref = await addDoc(collection(db, "requests"), {
    patientId,
    pharmacyId,
    medicines,         // array of { name, quantity }
    notes,
    preferredPickupTime,
    status:    "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}


// ── Fetch all requests for a patient ─────────────────────────────────────────
export async function getPatientRequests(patientId) {
  const q = query(
    collection(db, "requests"),
    where("patientId", "==", patientId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


// ── Fetch a single request ────────────────────────────────────────────────────
export async function getRequest(requestId) {
  const snap = await getDoc(doc(db, "requests", requestId));
  if (!snap.exists()) throw new Error("Request not found");
  return { id: snap.id, ...snap.data() };
}


// ── Live listener for a single request (for request-detail page) ──────────────
export function listenToRequest(requestId, callback) {
  return onSnapshot(doc(db, "requests", requestId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}


// ── Cancel a request (patient can only cancel if still pending) ───────────────
export async function cancelRequest(requestId) {
  const request = await getRequest(requestId);
  if (request.status !== "pending") {
    throw new Error("Only pending requests can be cancelled.");
  }
  await updateDoc(doc(db, "requests", requestId), {
    status:    "cancelled",
    updatedAt: serverTimestamp()
  });
}


// ── Helpers ───────────────────────────────────────────────────────────────────
export function getStatusLabel(status) {
  const labels = {
    pending:   "Pending",
    confirmed: "Confirmed",
    ready:     "Ready for pickup",
    collected: "Collected",
    cancelled: "Cancelled"
  };
  return labels[status] || "Unknown";
}

export function getStatusClass(status) {
  const classes = {
    pending:   "status-pending",
    confirmed: "status-confirmed",
    ready:     "status-ready",
    collected: "status-collected",
    cancelled: "badge-danger"
  };
  return classes[status] || "badge-gray";
}

export function validateMedicines(medicines) {
  const errors = [];
  if (!medicines || medicines.length === 0) {
    errors.push("Add at least one medicine.");
    return errors;
  }
  medicines.forEach((m, i) => {
    if (!m.name || m.name.trim().length === 0)  errors.push(`Medicine ${i + 1}: name is required.`);
    if (!m.quantity || m.quantity < 1)           errors.push(`Medicine ${i + 1}: quantity must be at least 1.`);
  });
  return errors;
}