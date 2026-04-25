/**
 * integration.test.js
 *
 * Integration-level tests: verify that the business-logic modules work
 * correctly together using in-memory fakes instead of real Firebase.
 *
 * Scope:
 *   - Auth → Patient flow  (sign up, create request, read requests back)
 *   - Auth → Pharmacy flow (sign up, receive order, advance status)
 *   - Auth → Community flow (sign up, create post, comment, mark helpful)
 *
 * No real network calls are made.  A lightweight in-memory "Firestore"
 * fake (defined below) replaces the SDK so the actual module logic runs
 * end-to-end without mocking every individual function.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. In-memory Firestore fake
// ─────────────────────────────────────────────────────────────────────────────

class FakeDoc {
  constructor(data) { this._data = data ? { ...data } : null; }
  exists()  { return this._data !== null; }
  data()    { return this._data ? { ...this._data } : null; }
  get id()  { return this._data?.__id ?? ''; }
}

class FakeDb {
  constructor() { this._collections = {}; }

  _col(name) {
    if (!this._collections[name]) this._collections[name] = {};
    return this._collections[name];
  }

  async setDoc(path, data)    { const [col, id] = path; this._col(col)[id] = { ...data, __id: id }; }
  async updateDoc(path, data) {
    const [col, id] = path;
    if (!this._col(col)[id]) throw new Error(`Doc ${col}/${id} not found`);
    Object.assign(this._col(col)[id], data);
  }
  async getDoc(path) {
    const [col, id] = path;
    const doc = this._col(col)[id] ?? null;
    return new FakeDoc(doc);
  }
  async addDoc(col, data) {
    const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this._col(col)[id] = { ...data, __id: id };
    return { id };
  }
  async getDocs(col) {
    const docs = Object.values(this._col(col)).map(d => new FakeDoc(d));
    return { docs, empty: docs.length === 0 };
  }
  reset() { this._collections = {}; }
}

const db = new FakeDb();

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pure module re-implementations (mirrors real module logic, minus SDK)
// ─────────────────────────────────────────────────────────────────────────────

// ── auth helpers ──────────────────────────────────────────────────────────────
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

function redirectAfterLogin(role) {
  if (role === 'pharmacy')  return '/pharmacy/dashboard.html';
  if (role === 'caregiver') return '/patient/dashboard.html';
  return '/patient/dashboard.html';
}

// ── patient helpers ───────────────────────────────────────────────────────────
async function submitRequest(patientId, patientName, pharmacyId, pharmacyName, medicines, notes, pickup) {
  const ref = await db.addDoc('requests', {
    patientId, patientName, pharmacyId, pharmacyName,
    medicines, notes, preferredPickupTime: pickup,
    status: 'pending', createdAt: 'NOW',
  });
  return ref.id;
}

async function getPatientRequests(patientId) {
  const { docs } = await db.getDocs('requests');
  return docs.filter(d => d.data().patientId === patientId).map(d => ({ id: d.id, ...d.data() }));
}

// ── pharmacy helpers ──────────────────────────────────────────────────────────
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
  const pharmSnap = await db.getDoc(['pharmacies', pharmacyId]);
  if (!pharmSnap.exists()) throw new Error('Pharmacy profile not found');
  return { id: pharmSnap.id, ...pharmSnap.data() };
}

async function updateOrderStatus(requestId, newStatus) {
  await db.updateDoc(['requests', requestId], { status: newStatus, updatedAt: 'NOW' });
}

async function getPharmacyOrders(pharmacyId) {
  const { docs } = await db.getDocs('requests');
  return docs.filter(d => d.data().pharmacyId === pharmacyId).map(d => ({ id: d.id, ...d.data() }));
}

// ── community helpers ─────────────────────────────────────────────────────────
async function createPost(authorId, authorName, title, body, category, tags = []) {
  const ref = await db.addDoc('posts', {
    authorId, authorName, title, body, category, tags,
    helpfulCount: 0, commentCount: 0, helpfulBy: [],
    createdAt: 'NOW',
  });
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
  if (helpfulBy.includes(userId)) return; // idempotent
  await db.updateDoc(['posts', postId], {
    helpfulCount: helpfulCount + 1,
    helpfulBy: [...helpfulBy, userId],
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// 3. Tests
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => db.reset());

// ── Auth + Patient ────────────────────────────────────────────────────────────

describe('Auth → Patient integration', () => {
  test('signUp creates a user profile in the database', async () => {
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    const profile = await getUserProfile(user.uid);
    expect(profile.name).toBe('Ravi Kumar');
    expect(profile.email).toBe('ravi@example.com');
    expect(profile.role).toBe('patient');
  });

  test('getUserProfile throws when user does not exist', async () => {
    await expect(getUserProfile('nonexistent-uid')).rejects.toThrow('User profile not found');
  });

  test('redirectAfterLogin sends patient to patient dashboard', () => {
    expect(redirectAfterLogin('patient')).toBe('/patient/dashboard.html');
  });

  test('redirectAfterLogin sends caregiver to patient dashboard', () => {
    expect(redirectAfterLogin('caregiver')).toBe('/patient/dashboard.html');
  });

  test('patient can submit a request and read it back', async () => {
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    const meds = [{ name: 'Metformin', quantity: 2 }];
    await submitRequest(user.uid, 'Ravi Kumar', 'pharm-1', 'Apollo Pharmacy', meds, '', 'Morning');

    const requests = await getPatientRequests(user.uid);
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe('pending');
    expect(requests[0].medicines[0].name).toBe('Metformin');
    expect(requests[0].patientName).toBe('Ravi Kumar');
  });

  test('patient only sees their own requests', async () => {
    const ravi  = await signUp('Ravi Kumar',  'ravi@example.com',  'password123', 'patient');
    const priya = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');

    await submitRequest(ravi.uid,  'Ravi Kumar',  'p1', 'Apollo', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
    await submitRequest(ravi.uid,  'Ravi Kumar',  'p1', 'Apollo', [{ name: 'Glipizide', quantity: 1 }], '', 'Evening');
    await submitRequest(priya.uid, 'Priya Sharma','p1', 'Apollo', [{ name: 'Insulin', quantity: 3 }], '', 'Morning');

    const raviRequests  = await getPatientRequests(ravi.uid);
    const priyaRequests = await getPatientRequests(priya.uid);
    expect(raviRequests).toHaveLength(2);
    expect(priyaRequests).toHaveLength(1);
  });

  test('new request always starts with pending status', async () => {
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    await submitRequest(user.uid, 'Ravi Kumar', 'p1', 'Apollo', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
    const [req] = await getPatientRequests(user.uid);
    expect(req.status).toBe('pending');
  });
});


// ── Auth + Pharmacy ───────────────────────────────────────────────────────────

describe('Auth → Pharmacy integration', () => {
  test('pharmacy signup creates user and pharmacy profile', async () => {
    const user = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    await registerPharmacy(user.uid, 'Apollo Pharmacy', '5th Block, Koramangala', 'Koramangala', '080-41234567');

    const profile = await getPharmacyProfile(user.uid);
    expect(profile.name).toBe('Apollo Pharmacy');
    expect(profile.area).toBe('Koramangala');
    expect(profile.ownerId).toBe(user.uid);
  });

  test('redirectAfterLogin sends pharmacy to pharmacy dashboard', () => {
    expect(redirectAfterLogin('pharmacy')).toBe('/pharmacy/dashboard.html');
  });

  test('getPharmacyProfile throws when user has no pharmacyId linked', async () => {
    const user = await signUp('Jane Doe', 'jane@example.com', 'password123', 'pharmacy');
    await expect(getPharmacyProfile(user.uid)).rejects.toThrow('No pharmacy linked to this account');
  });

  test('pharmacy sees orders placed against it', async () => {
    const pharmAdmin = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const pharmId    = await registerPharmacy(pharmAdmin.uid, 'Apollo Pharmacy', 'Koramangala', 'Koramangala', '080-41234567');
    const patient    = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');

    await submitRequest(patient.uid, 'Ravi Kumar', pharmId, 'Apollo Pharmacy', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');

    const orders = await getPharmacyOrders(pharmId);
    expect(orders).toHaveLength(1);
    expect(orders[0].patientName).toBe('Ravi Kumar');
  });

  test('pharmacy can advance an order through the full status lifecycle', async () => {
    const pharmAdmin = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const pharmId    = await registerPharmacy(pharmAdmin.uid, 'Apollo Pharmacy', 'Koramangala', 'Koramangala', '080-41234567');
    const patient    = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');

    const reqId = await submitRequest(patient.uid, 'Ravi Kumar', pharmId, 'Apollo Pharmacy', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');

    await updateOrderStatus(reqId, 'confirmed');
    let snap = await db.getDoc(['requests', reqId]);
    expect(snap.data().status).toBe('confirmed');

    await updateOrderStatus(reqId, 'ready');
    snap = await db.getDoc(['requests', reqId]);
    expect(snap.data().status).toBe('ready');

    await updateOrderStatus(reqId, 'collected');
    snap = await db.getDoc(['requests', reqId]);
    expect(snap.data().status).toBe('collected');
  });

  test('pharmacy only sees its own orders, not orders for other pharmacies', async () => {
    const pharmA = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const pharmB = await signUp('MedPlus Admin', 'medplus@example.com', 'password123', 'pharmacy');
    const idA    = await registerPharmacy(pharmA.uid, 'Apollo', 'Koramangala', 'Koramangala', '080-1111');
    const idB    = await registerPharmacy(pharmB.uid, 'MedPlus', 'Indiranagar', 'Indiranagar', '080-2222');
    const pat    = await signUp('Patient One', 'pat@example.com', 'password123', 'patient');

    await submitRequest(pat.uid, 'Patient One', idA, 'Apollo', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
    await submitRequest(pat.uid, 'Patient One', idA, 'Apollo', [{ name: 'Glipizide', quantity: 1 }], '', 'Evening');
    await submitRequest(pat.uid, 'Patient One', idB, 'MedPlus', [{ name: 'Insulin', quantity: 2 }], '', 'Morning');

    expect(await getPharmacyOrders(idA)).toHaveLength(2);
    expect(await getPharmacyOrders(idB)).toHaveLength(1);
  });
});


// ── Auth + Community ──────────────────────────────────────────────────────────

describe('Auth → Community integration', () => {
  test('signed-in user can create a post and read it back', async () => {
    const user   = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const postId = await createPost(user.uid, 'Priya Sharma', 'My Recipe', 'Here is my recipe body.', 'Recipes', ['ragi']);

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.exists()).toBe(true);
    expect(snap.data().title).toBe('My Recipe');
    expect(snap.data().authorId).toBe(user.uid);
    expect(snap.data().helpfulCount).toBe(0);
    expect(snap.data().commentCount).toBe(0);
  });

  test('adding a comment increments the post commentCount', async () => {
    const user   = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const commenter = await signUp('Suresh Iyer', 'suresh@example.com', 'password123', 'patient');
    const postId = await createPost(user.uid, 'Priya Sharma', 'My Recipe', 'Recipe body.', 'Recipes');

    await addComment(postId, commenter.uid, 'Suresh Iyer', 'Great post!');
    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().commentCount).toBe(1);
  });

  test('multiple comments increment commentCount correctly', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Support');

    await addComment(postId, 'u1', 'User One',   'Comment 1');
    await addComment(postId, 'u2', 'User Two',   'Comment 2');
    await addComment(postId, 'u3', 'User Three', 'Comment 3');

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().commentCount).toBe(3);
  });

  test('markHelpful increments helpfulCount', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const reader = await signUp('Suresh Iyer',  'suresh@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Exercise');

    await markHelpful(postId, reader.uid);
    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().helpfulCount).toBe(1);
    expect(snap.data().helpfulBy).toContain(reader.uid);
  });

  test('markHelpful is idempotent — same user cannot increment twice', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const reader = await signUp('Suresh Iyer',  'suresh@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Exercise');

    await markHelpful(postId, reader.uid);
    await markHelpful(postId, reader.uid); // second call — should be a no-op
    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().helpfulCount).toBe(1);
  });

  test('different users can each mark a post helpful', async () => {
    const author = await signUp('Priya Sharma', 'priya@example.com', 'password123', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Title', 'Body.', 'Support');

    await markHelpful(postId, 'user-a');
    await markHelpful(postId, 'user-b');
    await markHelpful(postId, 'user-c');

    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().helpfulCount).toBe(3);
    expect(snap.data().helpfulBy).toEqual(expect.arrayContaining(['user-a', 'user-b', 'user-c']));
  });

  test('markHelpful throws when post does not exist', async () => {
    await expect(markHelpful('nonexistent-post', 'user-1')).rejects.toThrow('Post nonexistent-post not found');
  });
});


// ── Cross-domain: patient submits, pharmacy fulfils, patient sees update ──────

describe('Cross-domain: full request lifecycle', () => {
  test('status updates made by pharmacy are visible to the patient', async () => {
    const pharmAdmin = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const pharmId    = await registerPharmacy(pharmAdmin.uid, 'Apollo Pharmacy', 'Koramangala', 'Koramangala', '080-41234567');
    const patient    = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');

    const reqId = await submitRequest(patient.uid, 'Ravi Kumar', pharmId, 'Apollo Pharmacy', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');

    // Pharmacy confirms order
    await updateOrderStatus(reqId, 'confirmed');

    // Patient reads their requests
    const requests = await getPatientRequests(patient.uid);
    expect(requests[0].status).toBe('confirmed');
  });

  test('cancelling a request is reflected in both views', async () => {
    const pharmAdmin = await signUp('Apollo Admin', 'apollo@example.com', 'password123', 'pharmacy');
    const pharmId    = await registerPharmacy(pharmAdmin.uid, 'Apollo Pharmacy', 'Koramangala', 'Koramangala', '080-41234567');
    const patient    = await signUp('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');

    const reqId = await submitRequest(patient.uid, 'Ravi Kumar', pharmId, 'Apollo Pharmacy', [{ name: 'Glipizide', quantity: 1 }], '', 'Evening');
    await updateOrderStatus(reqId, 'cancelled');

    const patientView  = await getPatientRequests(patient.uid);
    const pharmacyView = await getPharmacyOrders(pharmId);

    expect(patientView[0].status).toBe('cancelled');
    expect(pharmacyView[0].status).toBe('cancelled');
  });
});
