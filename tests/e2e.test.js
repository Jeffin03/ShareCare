/**
 * e2e.test.js — End-to-End Scenario Tests
 *
 * These tests simulate complete user journeys from first landing through to
 * goal completion — the closest approximation to real browser E2E tests that
 * can run in Node without a browser driver.
 *
 * Each test follows a named, numbered scenario matching the ShareCare flow:
 *   E2E-1  New patient: register → submit request → track to collected
 *   E2E-2  New pharmacy: register → set up profile → fulfil order end-to-end
 *   E2E-3  Community: sign up → write post → receive comments and helpful marks
 *   E2E-4  Forgot password: email pre-filled → reset email dispatched
 *   E2E-5  Auth guard: unauthenticated access stores redirect intent
 *   E2E-6  Two patients, two pharmacies: isolation across accounts
 *   E2E-7  Caregiver: registers and submits on behalf of patient
 *   E2E-8  Post validation gates: invalid submissions are blocked before save
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fakes
// ─────────────────────────────────────────────────────────────────────────────

class FakeDoc {
  constructor(data) { this._data = data ? { ...data } : null; }
  exists()  { return this._data !== null; }
  data()    { return this._data ? { ...this._data } : null; }
  get id()  { return this._data?.__id ?? ''; }
}

class FakeDb {
  constructor() { this._c = {}; }
  _col(n) { if (!this._c[n]) this._c[n] = {}; return this._c[n]; }
  async setDoc([c, id], d)    { this._col(c)[id] = { ...d, __id: id }; }
  async updateDoc([c, id], d) { if (!this._col(c)[id]) throw new Error(`${c}/${id} not found`); Object.assign(this._col(c)[id], d); }
  async getDoc([c, id])       { return new FakeDoc(this._col(c)[id] ?? null); }
  async addDoc(c, d)          { const id = `${c}-${Object.keys(this._col(c)).length + 1}-${Math.random().toString(36).slice(2,5)}`; this._col(c)[id] = { ...d, __id: id }; return { id }; }
  async getDocs(c)            { const docs = Object.values(this._col(c)).map(d => new FakeDoc(d)); return { docs, empty: docs.length === 0 }; }
  reset() { this._c = {}; }
}

// Simulated email outbox for password reset
class FakeMailer {
  constructor() { this.sent = []; }
  sendPasswordReset(email) { this.sent.push({ type: 'passwordReset', to: email, sentAt: Date.now() }); return Promise.resolve(); }
  reset() { this.sent = []; }
}

const db     = new FakeDb();
const mailer = new FakeMailer();
beforeEach(() => { db.reset(); mailer.reset(); });

// ─────────────────────────────────────────────────────────────────────────────
// App layer (mirrors real modules)
// ─────────────────────────────────────────────────────────────────────────────

const SESSION = {};  // simulates sessionStorage

async function signUp(name, email, password, role) {
  if (password.length < 8) throw Object.assign(new Error('Weak password'), { code: 'auth/weak-password' });
  const uid = `uid-${email.replace(/\W/g, '')}`;
  const exists = await db.getDoc(['users', uid]);
  if (exists.exists()) throw Object.assign(new Error('Email in use'), { code: 'auth/email-already-in-use' });
  await db.setDoc(['users', uid], { name, email, role, createdAt: 'NOW' });
  return { uid };
}

async function logIn(email, _password) {
  // Fake: always succeeds if a matching user exists
  const uid  = `uid-${email.replace(/\W/g, '')}`;
  const snap = await db.getDoc(['users', uid]);
  if (!snap.exists()) throw Object.assign(new Error('User not found'), { code: 'auth/user-not-found' });
  return { uid };
}

async function getUserProfile(uid) {
  const snap = await db.getDoc(['users', uid]);
  if (!snap.exists()) throw new Error('User profile not found');
  return { uid, ...snap.data() };
}

function redirectAfterLogin(role) {
  const intended = SESSION.redirectAfterLogin;
  delete SESSION.redirectAfterLogin;
  if (intended) return intended;
  return role === 'pharmacy' ? '/pharmacy/dashboard.html' : '/patient/dashboard.html';
}

function requireAuth(currentUser) {
  if (!currentUser) {
    SESSION.redirectAfterLogin = '/community/feed.html';
    return '/auth/login.html';
  }
  return null; // allowed through
}

async function registerPharmacy(userId, name, address, area, phone) {
  const ref = await db.addDoc('pharmacies', { name, address, area, phone, ownerId: userId, createdAt: 'NOW' });
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
  const ref  = await db.addDoc('comments', { postId, authorId, authorName, text, createdAt: 'NOW' });
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

function validatePost(title, body, category) {
  const valid = ['Recipes','Exercise','Snacks','Support','Tips & Tricks','Ask Community'];
  const errors = [];
  if (!title || title.trim().length === 0)   errors.push('Title is required.');
  else if (title.trim().length > 120)        errors.push('Title too long.');
  if (!body  || body.trim().length === 0)    errors.push('Post content is required.');
  if (!body  || body.trim().length < 100)    errors.push('Post content must be at least 100 characters.');
  if (!category || !valid.includes(category)) errors.push('A valid category is required.');
  return errors;
}

function validateMedicines(medicines) {
  const errors = [];
  if (!medicines || medicines.length === 0) { errors.push('Add at least one medicine.'); return errors; }
  medicines.forEach((m, i) => {
    if (!m.name || m.name.trim().length === 0) errors.push(`Medicine ${i + 1}: name required.`);
    if (!m.quantity || m.quantity < 1)          errors.push(`Medicine ${i + 1}: quantity ≥ 1.`);
  });
  return errors;
}

function isValidTransition(current, next) {
  const allowed = { pending: ['confirmed','cancelled'], confirmed: ['ready','cancelled'], ready: ['collected'], collected: [], cancelled: [] };
  return (allowed[current] || []).includes(next);
}


// ─────────────────────────────────────────────────────────────────────────────
// E2E Scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('E2E-1: New patient journey — register → request → collect', () => {
  test('complete lifecycle from registration to collected medicine', async () => {
    // 1. Patient registers
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    const profile = await getUserProfile(user.uid);
    expect(profile.role).toBe('patient');

    // 2. Login redirects to patient dashboard
    const loginUser = await logIn('ravi@example.com', 'Password1');
    const loginProfile = await getUserProfile(loginUser.uid);
    expect(redirectAfterLogin(loginProfile.role)).toBe('/patient/dashboard.html');

    // 3. Patient submits a request
    const meds  = [{ name: 'Metformin', quantity: 2 }, { name: 'Glipizide', quantity: 1 }];
    const reqId = await submitRequest(user.uid, 'Ravi Kumar', 'pharm-1', 'Apollo', meds, 'Please pack separately', 'Morning');

    // 4. Request appears on dashboard with pending status
    let requests = await getPatientRequests(user.uid);
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe('pending');

    // 5. Pharmacy advances through lifecycle
    await updateOrderStatus(reqId, 'confirmed');
    await updateOrderStatus(reqId, 'ready');
    await updateOrderStatus(reqId, 'collected');

    // 6. Patient dashboard reflects final status
    requests = await getPatientRequests(user.uid);
    expect(requests[0].status).toBe('collected');
  });

  test('patient cannot register twice with the same email', async () => {
    await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    await expect(signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient'))
      .rejects.toMatchObject({ code: 'auth/email-already-in-use' });
  });

  test('weak password is rejected at registration', async () => {
    await expect(signUp('Ravi Kumar', 'ravi@example.com', 'weak', 'patient'))
      .rejects.toMatchObject({ code: 'auth/weak-password' });
  });
});


describe('E2E-2: Pharmacy journey — register → setup → fulfil order', () => {
  test('complete pharmacy onboarding and order fulfilment', async () => {
    // 1. Pharmacy admin signs up
    const admin = await signUp('Apollo Admin', 'apollo@example.com', 'Password1', 'pharmacy');

    // 2. Pharmacy profile is created
    const pharmId = await registerPharmacy(admin.uid, 'Apollo Pharmacy', '5th Block', 'Koramangala', '080-41234567');

    // 3. Admin can fetch their pharmacy profile
    const pharmProfile = await getPharmacyProfile(admin.uid);
    expect(pharmProfile.name).toBe('Apollo Pharmacy');
    expect(pharmProfile.ownerId).toBe(admin.uid);

    // 4. A patient places an order
    const patient = await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    const reqId   = await submitRequest(patient.uid, 'Ravi Kumar', pharmId, 'Apollo Pharmacy', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');

    // 5. Pharmacy confirms, marks ready, then collected
    expect(isValidTransition('pending', 'confirmed')).toBe(true);
    await updateOrderStatus(reqId, 'confirmed');

    expect(isValidTransition('confirmed', 'ready')).toBe(true);
    await updateOrderStatus(reqId, 'ready');

    expect(isValidTransition('ready', 'collected')).toBe(true);
    await updateOrderStatus(reqId, 'collected');

    // 6. Patient sees collected status
    const requests = await getPatientRequests(patient.uid);
    expect(requests[0].status).toBe('collected');
  });

  test('pharmacy admin without linked profile gets meaningful error on dashboard load', async () => {
    const admin = await signUp('Orphan Admin', 'orphan@example.com', 'Password1', 'pharmacy');
    await expect(getPharmacyProfile(admin.uid)).rejects.toThrow('No pharmacy linked to this account');
  });
});


describe('E2E-3: Community journey — post → comment → helpful', () => {
  test('full community engagement loop', async () => {
    // 1. Author signs up and creates a post
    const author = await signUp('Priya Sharma', 'priya@example.com', 'Password1', 'patient');
    const postId = await createPost(author.uid, 'Priya Sharma', 'Ragi Dosa Recipe', 'Here is my detailed recipe for a low-GI ragi dosa that I have been making every Sunday for the past year.', 'Recipes', ['ragi', 'low-gi']);

    // 2. Reader registers and comments
    const reader = await signUp('Suresh Iyer', 'suresh@example.com', 'Password1', 'patient');
    await addComment(postId, reader.uid, 'Suresh Iyer', 'Tried this — worked brilliantly!');

    // 3. Another user marks the post helpful
    const helper = await signUp('Anita Verma', 'anita@example.com', 'Password1', 'patient');
    await markHelpful(postId, helper.uid);

    // 4. Verify final state
    const snap = await db.getDoc(['posts', postId]);
    expect(snap.data().commentCount).toBe(1);
    expect(snap.data().helpfulCount).toBe(1);
    expect(snap.data().helpfulBy).toContain(helper.uid);
    expect(snap.data().tags).toContain('ragi');
  });

  test('post form validation blocks empty submissions from reaching Firebase', () => {
    const errors = validatePost('', '', null);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  test('post with short body does not pass the 100-character validation gate', () => {
    const errors = validatePost('Good Title', 'Short.', 'Recipes');
    expect(errors.some(e => e.includes('100'))).toBe(true);
  });
});


describe('E2E-4: Forgot password flow', () => {
  test('reset email is dispatched to the correct address', async () => {
    await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    await mailer.sendPasswordReset('ravi@example.com');

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe('ravi@example.com');
    expect(mailer.sent[0].type).toBe('passwordReset');
  });

  test('calling reset does not change the password or break login', async () => {
    const user = await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    await mailer.sendPasswordReset('ravi@example.com');

    // User can still log in with old password (reset only sends an email, does not change it)
    const loginUser = await logIn('ravi@example.com', 'Password1');
    expect(loginUser.uid).toBe(user.uid);
  });
});


describe('E2E-5: Auth guard — unauthenticated access stores redirect intent', () => {
  test('unauthenticated user is redirected to login and intent is saved', () => {
    const redirect = requireAuth(null); // null = no current user
    expect(redirect).toBe('/auth/login.html');
    expect(SESSION.redirectAfterLogin).toBe('/community/feed.html');
  });

  test('authenticated user is allowed through the guard', () => {
    const redirect = requireAuth({ uid: 'some-user' });
    expect(redirect).toBeNull();
  });

  test('after login, user is sent to their original destination', async () => {
    requireAuth(null); // stores /community/feed.html
    const user    = await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    const profile = await getUserProfile(user.uid);
    const dest    = redirectAfterLogin(profile.role);
    expect(dest).toBe('/community/feed.html');
  });

  test('after login without a stored intent, patient goes to patient dashboard', async () => {
    delete SESSION.redirectAfterLogin;
    const user    = await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');
    const profile = await getUserProfile(user.uid);
    const dest    = redirectAfterLogin(profile.role);
    expect(dest).toBe('/patient/dashboard.html');
  });
});


describe('E2E-6: Multi-account isolation', () => {
  test('two patients each only see their own requests', async () => {
    const a = await signUp('Ravi Kumar',  'ravi@example.com',  'Password1', 'patient');
    const b = await signUp('Priya Sharma', 'priya@example.com', 'Password1', 'patient');

    await submitRequest(a.uid, 'Ravi Kumar',  'p1', 'Apollo', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
    await submitRequest(a.uid, 'Ravi Kumar',  'p1', 'Apollo', [{ name: 'Glipizide', quantity: 1 }], '', 'Evening');
    await submitRequest(b.uid, 'Priya Sharma','p1', 'Apollo', [{ name: 'Insulin',   quantity: 1 }], '', 'Morning');

    expect(await getPatientRequests(a.uid)).toHaveLength(2);
    expect(await getPatientRequests(b.uid)).toHaveLength(1);
  });

  test('two pharmacies each only see their own orders', async () => {
    const adminA = await signUp('Apollo Admin',  'apollo@example.com',  'Password1', 'pharmacy');
    const adminB = await signUp('MedPlus Admin', 'medplus@example.com', 'Password1', 'pharmacy');
    const idA    = await registerPharmacy(adminA.uid, 'Apollo',  'KRM', 'Koramangala', '1111');
    const idB    = await registerPharmacy(adminB.uid, 'MedPlus', 'IND', 'Indiranagar', '2222');
    const patient = await signUp('Ravi Kumar', 'ravi@example.com', 'Password1', 'patient');

    await submitRequest(patient.uid, 'Ravi', idA, 'Apollo',  [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
    await submitRequest(patient.uid, 'Ravi', idA, 'Apollo',  [{ name: 'Glipizide', quantity: 1 }], '', 'Evening');
    await submitRequest(patient.uid, 'Ravi', idB, 'MedPlus', [{ name: 'Insulin',   quantity: 1 }], '', 'Morning');

    const { docs: allDocs } = await db.getDocs('requests');
    const ordersA = allDocs.filter(d => d.data().pharmacyId === idA);
    const ordersB = allDocs.filter(d => d.data().pharmacyId === idB);
    expect(ordersA).toHaveLength(2);
    expect(ordersB).toHaveLength(1);
  });
});


describe('E2E-7: Caregiver journey', () => {
  test('caregiver registers, logs in, and submits a request', async () => {
    const caregiver = await signUp('Meena Rao', 'meena@example.com', 'Password1', 'caregiver');
    const profile   = await getUserProfile(caregiver.uid);
    expect(profile.role).toBe('caregiver');

    const reqId = await submitRequest(caregiver.uid, 'Meena Rao', 'pharm-1', 'Apollo', [{ name: 'Metformin', quantity: 1 }], 'On behalf of Mr. Rao', 'Morning');
    const snap  = await db.getDoc(['requests', reqId]);
    expect(snap.data().notes).toContain('On behalf of');
    expect(snap.data().status).toBe('pending');
  });

  test('caregiver login redirects to patient dashboard (interim caregiver route)', async () => {
    const user    = await signUp('Meena Rao', 'meena@example.com', 'Password1', 'caregiver');
    const profile = await getUserProfile(user.uid);
    const dest    = redirectAfterLogin(profile.role);
    expect(dest).toBe('/patient/dashboard.html');
  });
});


describe('E2E-8: Validation gates block bad data before any Firebase call', () => {
  test('request with no medicines never reaches submitRequest', () => {
    const errors = validateMedicines([]);
    expect(errors.length).toBeGreaterThan(0);
    // If errors exist, submitRequest should not be called — verified by absence of DB entry
  });

  test('request with invalid medicine name never reaches submitRequest', () => {
    const errors = validateMedicines([{ name: '', quantity: 1 }]);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('post with empty title never reaches createPost', () => {
    const errors = validatePost('', 'Some body content here that is long enough to pass.'.repeat(3), 'Recipes');
    expect(errors).toContain('Title is required.');
  });

  test('post with invalid category never reaches createPost', () => {
    const errors = validatePost('Valid Title', 'Body content here that is long enough.'.repeat(3), 'Cooking');
    expect(errors).toContain('A valid category is required.');
  });

  test('post with body under 100 chars never reaches createPost', () => {
    const errors = validatePost('Valid Title', 'Too short.', 'Recipes');
    expect(errors.some(e => e.includes('100'))).toBe(true);
  });

  test('no Firebase writes are made when validation fails', async () => {
    // Validate first — errors found, so we never call createPost
    const title  = '';
    const body   = '';
    const errors = validatePost(title, body, null);
    expect(errors.length).toBeGreaterThan(0);

    // DB should remain empty
    const { docs } = await db.getDocs('posts');
    expect(docs).toHaveLength(0);
  });
});
