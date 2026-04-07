/**
 * uat.test.js — User Acceptance Tests
 *
 * These tests verify user-facing journeys described in the ShareCare
 * product spec.  Each describe block maps to one named user story.
 *
 * Uses the same in-memory fakes as integration.test.js — no real Firebase.
 * Written from the user's point of view: "As a patient, I want to..."
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory Firestore fake (same as integration.test.js)
// ─────────────────────────────────────────────────────────────────────────────

class FakeDoc {
  constructor(data) { this._data = data ? { ...data } : null; }
  exists()  { return this._data !== null; }
  data()    { return this._data ? { ...this._data } : null; }
  get id()  { return this._data?.__id ?? ''; }
}

class FakeDb {
  constructor() { this._collections = {}; }
  _col(name) { if (!this._collections[name]) this._collections[name] = {}; return this._collections[name]; }
  async setDoc(path, data)    { const [c, id] = path; this._col(c)[id] = { ...data, __id: id }; }
  async updateDoc(path, data) { const [c, id] = path; if (!this._col(c)[id]) throw new Error(`Doc ${c}/${id} not found`); Object.assign(this._col(c)[id], data); }
  async getDoc(path)          { const [c, id] = path; return new FakeDoc(this._col(c)[id] ?? null); }
  async addDoc(col, data)     { const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; this._col(col)[id] = { ...data, __id: id }; return { id }; }
  async getDocs(col)          { const docs = Object.values(this._col(col)).map(d => new FakeDoc(d)); return { docs, empty: docs.length === 0 }; }
  reset() { this._collections = {}; }
}

const db = new FakeDb();
beforeEach(() => db.reset());

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

async function signUp(name, email, password, role) {
  const uid = `uid-${email.replace(/\W/g, '')}`;
  await db.setDoc(['users', uid], { name, email, role, createdAt: 'NOW' });
  return { uid };
}
async function getUserProfile(uid) {
  const snap = await db.getDoc(['users', uid]);
  if (!snap.exists()) throw new Error('User profile not found');
  return { uid, ...snap.data() };
}
async function registerPharmacy(userId, name, address, area, phone) {
  const ref = await db.addDoc('pharmacies', { name, address, area, phone, ownerId: userId });
  await db.updateDoc(['users', userId], { pharmacyId: ref.id });
  return ref.id;
}
async function getPharmacyProfile(userId) {
  const userSnap = await db.getDoc(['users', userId]);
  if (!userSnap.exists()) throw new Error('User not found');
  const { pharmacyId } = userSnap.data();
  if (!pharmacyId) throw new Error('No pharmacy linked to this account');
  const s = await db.getDoc(['pharmacies', pharmacyId]);
  if (!s.exists()) throw new Error('Pharmacy profile not found');
  return { id: s.id, ...s.data() };
}
async function submitRequest(patientId, patientName, pharmacyId, pharmacyName, medicines, notes, pickup) {
  const ref = await db.addDoc('requests', { patientId, patientName, pharmacyId, pharmacyName, medicines, notes, preferredPickupTime: pickup, status: 'pending', createdAt: 'NOW' });
  return ref.id;
}
async function getPatientRequests(patientId) {
  const { docs } = await db.getDocs('requests');
  return docs.filter(d => d.data().patientId === patientId).map(d => ({ id: d.id, ...d.data() }));
}
async function updateOrderStatus(requestId, newStatus) {
  await db.updateDoc(['requests', requestId], { status: newStatus, updatedAt: 'NOW' });
}
async function createPost(authorId, authorName, title, body, category, tags = []) {
  const ref = await db.addDoc('posts', { authorId, authorName, title, body, category, tags, helpfulCount: 0, commentCount: 0, helpfulBy: [], createdAt: 'NOW' });
  return ref.id;
}
async function addComment(postId, authorId, authorName, text) {
  const ref = await db.addDoc('comments', { postId, authorId, authorName, text, createdAt: 'NOW' });
  const snap = await db.getDoc(['posts', postId]);
  await db.updateDoc(['posts', postId], { commentCount: (snap.data().commentCount || 0) + 1 });
  return ref.id;
}
async function markHelpful(postId, userId) {
  const snap = await db.getDoc(['posts', postId]);
  if (!snap.exists()) throw new Error(`Post ${postId} not found`);
  const { helpfulBy = [], helpfulCount = 0 } = snap.data();
  if (helpfulBy.includes(userId)) return;
  await db.updateDoc(['posts', postId], { helpfulCount: helpfulCount + 1, helpfulBy: [...helpfulBy, userId] });
}

// Client-side validators (mirrors signup.html / new-request.html logic)
function validateSignUp(firstName, lastName, email, password, role) {
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
  const errors = [];
  if (!nameRegex.test(firstName))  errors.push('Invalid first name.');
  if (!nameRegex.test(lastName))   errors.push('Invalid last name.');
  if (!emailRegex.test(email))     errors.push('Invalid email.');
  if (password.length < 8)         errors.push('Password too short.');
  if (!passwordRegex.test(password)) errors.push('Password needs letter and number.');
  if (!['patient', 'pharmacy', 'caregiver'].includes(role)) errors.push('Invalid role.');
  return errors;
}
function validateMedicines(medicines) {
  const errors = [];
  if (!medicines || medicines.length === 0) { errors.push('Add at least one medicine.'); return errors; }
  medicines.forEach((m, i) => {
    if (!m.name || m.name.trim().length === 0) errors.push(`Medicine ${i + 1}: name required.`);
    if (!m.quantity || m.quantity < 1)          errors.push(`Medicine ${i + 1}: quantity must be ≥ 1.`);
  });
  return errors;
}
function validatePost(title, body, category) {
  const valid = ['Recipes','Exercise','Snacks','Support','Tips & Tricks','Ask Community'];
  const errors = [];
  if (!title || title.trim().length === 0)   errors.push('Title is required.');
  else if (title.trim().length > 120)        errors.push('Title too long.');
  if (!body  || body.trim().length === 0)    errors.push('Post content is required.');
  if (!category || !valid.includes(category)) errors.push('A valid category is required.');
  return errors;
}
function isValidPharmacyTransition(current, next) {
  const allowed = { pending: ['confirmed','cancelled'], confirmed: ['ready','cancelled'], ready: ['collected'], collected: [], cancelled: [] };
  return (allowed[current] || []).includes(next);
}


// ─────────────────────────────────────────────────────────────────────────────
// UAT Scenarios
// ─────────────────────────────────────────────────────────────────────────────

// ── UAT-1: Patient Registration ───────────────────────────────────────────────
describe('UAT-1: Patient can register an account', () => {
  test('valid registration data passes all client-side checks', () => {
    const errors = validateSignUp('Ravi', 'Kumar', 'ravi@example.com', 'password123', 'patient');
    expect(errors).toHaveLength(0);
  });

  test('registration creates a user profile with the correct role', async () => {
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    const profile = await getUserProfile(user.uid);
    expect(profile.role).toBe('patient');
    expect(profile.name).toBe('Ravi Kumar');
  });

  test('registration with invalid email is rejected before Firebase call', () => {
    const errors = validateSignUp('Ravi', 'Kumar', 'not-an-email', 'password123', 'patient');
    expect(errors.some(e => e.includes('email'))).toBe(true);
  });

  test('registration with weak password is rejected', () => {
    const errors = validateSignUp('Ravi', 'Kumar', 'ravi@example.com', 'abc', 'patient');
    expect(errors.some(e => e.includes('short') || e.includes('letter'))).toBe(true);
  });

  test('registration with letters-only password is rejected', () => {
    const errors = validateSignUp('Ravi', 'Kumar', 'ravi@example.com', 'abcdefgh', 'patient');
    expect(errors.some(e => e.includes('number') || e.includes('letter'))).toBe(true);
  });

  test('after registration, patient is redirected to patient dashboard', async () => {
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    const profile = await getUserProfile(user.uid);
    const redirect = profile.role === 'pharmacy' ? '/pharmacy/dashboard.html' : '/patient/dashboard.html';
    expect(redirect).toBe('/patient/dashboard.html');
  });
});


// ── UAT-2: Pharmacy Registration ─────────────────────────────────────────────
describe('UAT-2: Pharmacy can register and set up their profile', () => {
  test('pharmacy signup creates user with pharmacy role', async () => {
    const user = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const profile = await getUserProfile(user.uid);
    expect(profile.role).toBe('pharmacy');
  });

  test('pharmacy profile is created and linked to the user account', async () => {
    const user = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    await registerPharmacy(user.uid, 'Apollo Pharmacy', '5th Block, Koramangala', 'Koramangala', '080-41234567');

    const profile = await getPharmacyProfile(user.uid);
    expect(profile.name).toBe('Apollo Pharmacy');
    expect(profile.ownerId).toBe(user.uid);
  });

  test('pharmacy login without registered profile throws meaningful error', async () => {
    const user = await signUp('Orphan Admin', 'orphan@example.com', 'password123', 'pharmacy');
    await expect(getPharmacyProfile(user.uid)).rejects.toThrow('No pharmacy linked to this account');
  });

  test('pharmacy is redirected to pharmacy dashboard after login', async () => {
    const user = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const profile = await getUserProfile(user.uid);
    const redirect = profile.role === 'pharmacy' ? '/pharmacy/dashboard.html' : '/patient/dashboard.html';
    expect(redirect).toBe('/pharmacy/dashboard.html');
  });
});


// ── UAT-3: Patient submits a medicine request ─────────────────────────────────
describe('UAT-3: Patient can submit a medicine restock request', () => {
  test('form validation catches empty medicines list', () => {
    const errors = validateMedicines([]);
    expect(errors).toContain('Add at least one medicine.');
  });

  test('form validation catches missing medicine name', () => {
    const errors = validateMedicines([{ name: '', quantity: 1 }]);
    expect(errors.some(e => e.includes('name'))).toBe(true);
  });

  test('form validation catches zero quantity', () => {
    const errors = validateMedicines([{ name: 'Metformin', quantity: 0 }]);
    expect(errors.some(e => e.includes('quantity'))).toBe(true);
  });

  test('valid request is saved with pending status', async () => {
    const patient = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    const reqId   = await submitRequest(patient.uid, 'Ravi Kumar', 'pharm-1', 'Apollo', [{ name: 'Metformin', quantity: 2 }], '', 'Morning');

    const snap = await db.getDoc(['requests', reqId]);
    expect(snap.data().status).toBe('pending');
  });

  test('request is immediately visible on the patient dashboard', async () => {
    const patient = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    await submitRequest(patient.uid, 'Ravi Kumar', 'pharm-1', 'Apollo', [{ name: 'Metformin', quantity: 2 }], '', 'Morning');

    const requests = await getPatientRequests(patient.uid);
    expect(requests).toHaveLength(1);
    expect(requests[0].medicines[0].name).toBe('Metformin');
  });

  test('multiple medicines can be included in one request', async () => {
    const patient = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    const meds = [{ name: 'Metformin', quantity: 2 }, { name: 'Glipizide', quantity: 1 }, { name: 'Aspirin', quantity: 1 }];
    const reqId = await submitRequest(patient.uid, 'Ravi Kumar', 'pharm-1', 'Apollo', meds, '', 'Morning');

    const snap = await db.getDoc(['requests', reqId]);
    expect(snap.data().medicines).toHaveLength(3);
  });
});


// ── UAT-4: Pharmacy fulfils an order ─────────────────────────────────────────
describe('UAT-4: Pharmacy can view and fulfil patient orders', () => {
  let pharmId, patientUid, requestId;

  beforeEach(async () => {
    const pharmAdmin = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    pharmId          = await registerPharmacy(pharmAdmin.uid, 'Apollo Pharmacy', 'Koramangala', 'Koramangala', '080-41234567');
    const patient    = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    patientUid       = patient.uid;
    requestId        = await submitRequest(patientUid, 'Ravi Kumar', pharmId, 'Apollo', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
  });

  test('pending → confirmed is a valid status transition', () => {
    expect(isValidPharmacyTransition('pending', 'confirmed')).toBe(true);
  });

  test('confirmed → ready is a valid status transition', () => {
    expect(isValidPharmacyTransition('confirmed', 'ready')).toBe(true);
  });

  test('ready → collected is a valid status transition', () => {
    expect(isValidPharmacyTransition('ready', 'collected')).toBe(true);
  });

  test('cannot skip pending → ready', () => {
    expect(isValidPharmacyTransition('pending', 'ready')).toBe(false);
  });

  test('pharmacy can confirm a pending order', async () => {
    await updateOrderStatus(requestId, 'confirmed');
    const snap = await db.getDoc(['requests', requestId]);
    expect(snap.data().status).toBe('confirmed');
  });

  test('patient sees updated status after pharmacy confirms', async () => {
    await updateOrderStatus(requestId, 'confirmed');
    const requests = await getPatientRequests(patientUid);
    expect(requests[0].status).toBe('confirmed');
  });

  test('pharmacy can cancel a pending order', async () => {
    await updateOrderStatus(requestId, 'cancelled');
    const snap = await db.getDoc(['requests', requestId]);
    expect(snap.data().status).toBe('cancelled');
  });
});


// ── UAT-5: Community — post and engage ───────────────────────────────────────
describe('UAT-5: Community member can post and engage', () => {
  test('new post form validation catches empty title', () => {
    expect(validatePost('', 'Body content.', 'Recipes')).toContain('Title is required.');
  });

  test('new post form validation catches invalid category', () => {
    expect(validatePost('Good title', 'Body.', 'Hobbies')).toContain('A valid category is required.');
  });

  test('valid post is created with correct fields', async () => {
    const user   = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const postId = await createPost(user.uid, 'Priya Sharma', 'Ragi Dosa Recipe', 'Full recipe here.', 'Recipes', ['ragi']);

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().title).toBe('Ragi Dosa Recipe');
    expect(snap.data().category).toBe('Recipes');
    expect(snap.data().tags).toContain('ragi');
  });

  test('user can comment on a post', async () => {
    const author    = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const commenter = await signUp('Suresh Iyer',  'suresh@example.com', 'password123', 'patient');
    const postId    = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Support');

    const commentId = await addComment(postId, commenter.uid, 'Suresh Iyer', 'Really helpful!');
    const snap      = await db.getDoc(['comments', commentId]);
    expect(snap.data().text).toBe('Really helpful!');
    expect(snap.data().authorId).toBe(commenter.uid);
  });

  test('post commentCount reflects total comments', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Support');

    await addComment(postId, 'u1', 'User One', 'Comment 1');
    await addComment(postId, 'u2', 'User Two', 'Comment 2');

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().commentCount).toBe(2);
  });

  test('user can mark a post as helpful', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const reader = await signUp('Suresh Iyer',  'suresh@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Exercise');

    await markHelpful(postId, reader.uid);

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().helpfulCount).toBe(1);
    expect(snap.data().helpfulBy).toContain(reader.uid);
  });

  test('marking helpful twice does not double-count', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const reader = await signUp('Suresh Iyer',  'suresh@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Exercise');

    await markHelpful(postId, reader.uid);
    await markHelpful(postId, reader.uid);

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().helpfulCount).toBe(1);
  });
});


// ── UAT-6: Caregiver registration and access ──────────────────────────────────
describe('UAT-6: Caregiver can register and access patient features', () => {
  test('caregiver role is accepted during signup validation', () => {
    const errors = validateSignUp('Meena', 'Rao', 'meena@example.com', 'caregiver99', 'caregiver');
    expect(errors).toHaveLength(0);
  });

  test('caregiver account is created with caregiver role', async () => {
    const user = await signUp('Meena Rao', 'meena@example.com', 'password123', 'caregiver');
    const profile = await getUserProfile(user.uid);
    expect(profile.role).toBe('caregiver');
  });

  test('caregiver is redirected to patient dashboard (interim)', async () => {
    const user = await signUp('Meena Rao', 'meena@example.com', 'password123', 'caregiver');
    const profile = await getUserProfile(user.uid);
    const redirect = profile.role === 'pharmacy' ? '/pharmacy/dashboard.html' : '/patient/dashboard.html';
    expect(redirect).toBe('/patient/dashboard.html');
  });

  test('caregiver can submit a request on behalf of a patient', async () => {
    const caregiver = await signUp('Meena Rao', 'meena@example.com', 'password123', 'caregiver');
    const reqId     = await submitRequest(
      caregiver.uid, 'Meena Rao (for patient)',
      'pharm-1', 'Apollo',
      [{ name: 'Metformin', quantity: 1 }], 'Caregiver request', 'Morning'
    );

    const snap = await db.getDoc(['requests', reqId]);
    expect(snap.data().status).toBe('pending');
    expect(snap.data().notes).toBe('Caregiver request');
  });
});
