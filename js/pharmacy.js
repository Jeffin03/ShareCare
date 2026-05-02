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
  setDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ── Get pharmacy profile for a given user ─────────────────────────────────────
export async function getPharmacyProfile(userId) {
  const userSnap = await getDoc(doc(db, "users", userId));
  if (!userSnap.exists()) throw new Error("User not found");
  const userData = userSnap.data();
  if (!userData.pharmacyId) throw new Error("No pharmacy linked to this account");
  const pharmSnap = await getDoc(doc(db, "pharmacies", userData.pharmacyId));
  if (!pharmSnap.exists()) throw new Error("Pharmacy profile not found");
  return { id: pharmSnap.id, ...pharmSnap.data() };
}


// ── Register a new pharmacy (called on first pharmacy signup) ─────────────────
export async function registerPharmacy(userId, name, address, area, phone) {
  console.log('A. registerPharmacy called with uid:', userId);
  const pharmRef = doc(collection(db, "pharmacies"));
  console.log('B. pharmRef created:', pharmRef.id);
  await setDoc(pharmRef, {
    name,
    address,
    area,
    phone,
    ownerId:   userId,
    createdAt: serverTimestamp()
  });
  console.log('C. setDoc done');
  await updateDoc(doc(db, "users", userId), {
    pharmacyId: pharmRef.id
  });
  console.log('D. updateDoc done');
  return pharmRef.id;
}


// ── Live listener for all orders for a pharmacy ───────────────────────────────
export function listenToPharmacyOrders(pharmacyId, callback) {
  const q = query(
    collection(db, "requests"),
    where("pharmacyId", "==", pharmacyId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}


// ── Fetch orders filtered by status ──────────────────────────────────────────
export function listenToPharmacyOrdersByStatus(pharmacyId, status, callback) {
  const q = query(
    collection(db, "requests"),
    where("pharmacyId", "==", pharmacyId),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}


// ── Get a single order ────────────────────────────────────────────────────────
export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, "requests", orderId));
  if (!snap.exists()) throw new Error("Order not found");
  return { id: snap.id, ...snap.data() };
}


// ── Live listener for a single order ─────────────────────────────────────────
export function listenToOrder(orderId, callback) {
  return onSnapshot(doc(db, "requests", orderId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}


// ── Update order status ───────────────────────────────────────────────────────
export async function updateOrderStatus(orderId, newStatus, pharmacyNotes = "") {
  const validTransitions = {
    pending:   ["confirmed", "cancelled"],
    confirmed: ["ready",     "cancelled"],
    ready:     ["collected", "dispatched"],
    dispatched: ["collected"],
    collected: [],
    cancelled: []
  };

  const order = await getOrder(orderId);
  const allowed = validTransitions[order.status] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot move from "${order.status}" to "${newStatus}".`);
  }

  const update = {
    status:    newStatus,
    updatedAt: serverTimestamp()
  };
  if (pharmacyNotes) update.pharmacyNotes = pharmacyNotes;

  await updateDoc(doc(db, "requests", orderId), update);
}


// ── Helpers ───────────────────────────────────────────────────────────────────
export function getStatusLabel(status) {
  const labels = {
    pending:   "Pending",
    confirmed: "Confirmed",
    ready:     "Ready for Pickup",
    dispatched: "Out for Delivery",
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
    dispatched: "status-ready",
    collected: "status-collected",
    cancelled: "badge-danger"
  };
  return classes[status] || "badge-gray";
}

export function getNextStatus(currentStatus) {
  const next = {
    pending:   "confirmed",
    confirmed: "ready",
    ready:     "collected",
    dispatched: "collected"
  };
  return next[currentStatus] || null;
}

export function getNextStatusLabel(currentStatus) {
  const labels = {
    pending:   "Confirm Order",
    confirmed: "Mark as Ready",
    ready:     "Mark as Collected",
    dispatched: "Mark as Collected"
  };
  return labels[currentStatus] || null;
}

export function getOrderCounts(orders) {
  return {
    total:     orders.length,
    pending:   orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    ready:     orders.filter(o => o.status === "ready").length,
    collected: orders.filter(o => o.status === "collected").length,
    cancelled: orders.filter(o => o.status === "cancelled").length
  };
}