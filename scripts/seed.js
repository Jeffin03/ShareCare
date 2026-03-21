#!/usr/bin/env node
/**
 * scripts/seed.js
 *
 * Production seed script for sharecare-prod.
 * Runs during CI/CD before every production deployment.
 *
 * Reads Firebase config from environment variables:
 *   PROD_FIREBASE_PROJECT_ID
 *   PROD_FIREBASE_CLIENT_EMAIL
 *   PROD_FIREBASE_PRIVATE_KEY      (newlines as literal \n)
 *
 * Usage:
 *   npm run seed
 */

'use strict';

const admin = require('firebase-admin');

// ─── Config from environment ──────────────────────────────────────────────────

const {
  PROD_FIREBASE_PROJECT_ID,
  PROD_FIREBASE_CLIENT_EMAIL,
  PROD_FIREBASE_PRIVATE_KEY,
} = process.env;

const missing = ['PROD_FIREBASE_PROJECT_ID', 'PROD_FIREBASE_CLIENT_EMAIL', 'PROD_FIREBASE_PRIVATE_KEY']
  .filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error('❌  Missing required environment variables:');
  missing.forEach(k => console.error(`     • ${k}`));
  process.exit(1);
}

// ─── Initialise Admin SDK ─────────────────────────────────────────────────────

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   PROD_FIREBASE_PROJECT_ID,
    clientEmail: PROD_FIREBASE_CLIENT_EMAIL,
    privateKey:  PROD_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const auth = admin.auth();
const db   = admin.firestore();

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(msg)       { console.log(`  ${msg}`); }
function section(title) { console.log(`\n▶  ${title}`); }
function ok(msg)        { console.log(`  ✓  ${msg}`); }
function warn(msg)      { console.warn(`  ⚠  ${msg}`); }

// ─── Timestamp helper ─────────────────────────────────────────────────────────

const { Timestamp } = admin.firestore;

function daysAgo(n)  { return Timestamp.fromDate(new Date(Date.now() - n * 86_400_000)); }
function hoursAgo(n) { return Timestamp.fromDate(new Date(Date.now() - n * 3_600_000)); }

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_PASSWORD = 'ShareCare@123';

const PHARMACIES = [
  {
    email: 'apollo.demo@sharecare.app',
    displayName: 'Apollo Pharmacy — Koramangala',
    pharmacy: {
      name: 'Apollo Pharmacy', area: 'Koramangala',
      address: '5th Block, Koramangala, Bangalore', phone: '080-41234567',
      active: true, createdAt: daysAgo(60),
    },
  },
  {
    email: 'medplus.demo@sharecare.app',
    displayName: 'MedPlus Health — Indiranagar',
    pharmacy: {
      name: 'MedPlus Health', area: 'Indiranagar',
      address: '100 Feet Road, Indiranagar, Bangalore', phone: '080-41234568',
      active: true, createdAt: daysAgo(45),
    },
  },
];

const PATIENTS = [
  { email: 'priya.demo@sharecare.app',   displayName: 'Priya Sharma', createdAt: daysAgo(30) },
  { email: 'suresh.demo@sharecare.app',  displayName: 'Suresh Iyer',  createdAt: daysAgo(25) },
  { email: 'anita.demo@sharecare.app',   displayName: 'Anita Verma',  createdAt: daysAgo(20) },
];

function buildRequests(patientIds, pharmacyIds) {
  return [
    { patientId: patientIds[0], patientName: 'Priya Sharma',  pharmacyId: pharmacyIds[0], pharmacyName: 'Apollo Pharmacy',
      medicines: [{ name: 'Metformin 500mg', quantity: 60 }, { name: 'Glipizide 5mg', quantity: 30 }],
      notes: 'Please include updated dosage instructions.', preferredPickupTime: 'Morning',
      status: 'collected', deliveryPreference: 'pickup', createdAt: daysAgo(14), updatedAt: daysAgo(10) },
    { patientId: patientIds[0], patientName: 'Priya Sharma',  pharmacyId: pharmacyIds[0], pharmacyName: 'Apollo Pharmacy',
      medicines: [{ name: 'Metformin 500mg', quantity: 60 }],
      notes: '', preferredPickupTime: 'Evening',
      status: 'ready', deliveryPreference: 'pickup', createdAt: daysAgo(3), updatedAt: daysAgo(1) },
    { patientId: patientIds[1], patientName: 'Suresh Iyer',   pharmacyId: pharmacyIds[0], pharmacyName: 'Apollo Pharmacy',
      medicines: [{ name: 'Januvia 100mg', quantity: 30 }, { name: 'Aspirin 75mg', quantity: 30 }],
      notes: 'Urgent — running low.', preferredPickupTime: 'Afternoon',
      status: 'confirmed', deliveryPreference: 'delivery', createdAt: daysAgo(2), updatedAt: hoursAgo(6) },
    { patientId: patientIds[2], patientName: 'Anita Verma',   pharmacyId: pharmacyIds[1], pharmacyName: 'MedPlus Health',
      medicines: [{ name: 'Insulin Glargine', quantity: 2 }],
      notes: 'Keep refrigerated during delivery.', preferredPickupTime: 'Morning',
      status: 'pending', deliveryPreference: 'delivery', createdAt: hoursAgo(5), updatedAt: hoursAgo(5) },
    { patientId: patientIds[1], patientName: 'Suresh Iyer',   pharmacyId: pharmacyIds[1], pharmacyName: 'MedPlus Health',
      medicines: [{ name: 'Sitagliptin 50mg', quantity: 30 }, { name: 'Atorvastatin 10mg', quantity: 30 }],
      notes: '', preferredPickupTime: 'Any',
      status: 'pending', deliveryPreference: 'pickup', createdAt: hoursAgo(2), updatedAt: hoursAgo(2) },
  ];
}

function buildPosts(patientIds, patientNames) {
  return [
    { authorId: patientIds[0], authorName: patientNames[0], category: 'Recipes',
      title: 'Low-GI Ragi Dosa — My Sunday Morning Staple',
      body: 'Swapped regular rice dosa with a ragi-oats blend and it changed my post-breakfast glucose numbers completely.\n\nMix 1 cup ragi flour, half cup oats (ground), 2 tbsp urad dal (soaked overnight). Ferment for 6-8 hours.\n\nMy readings show a peak of 148 mg/dL instead of the usual 190+ with regular dosa.',
      tags: ['ragi', 'low-gi', 'breakfast', 'recipe'],
      helpfulCount: 48, commentCount: 2, helpfulBy: [patientIds[1], patientIds[2]],
      createdAt: daysAgo(7), updatedAt: daysAgo(7) },
    { authorId: patientIds[2], authorName: patientNames[2], category: 'Recipes',
      title: '5 Diabetes-Friendly Snacks from Any Kirana Store',
      body: 'You do not need a speciality health store. Here is what I keep at home:\n\n1. Roasted chana\n2. Fox nuts (makhana)\n3. Peanuts\n4. Cucumber with lime\n5. Sprouted moong\n\nAll under Rs 30 per serving.',
      tags: ['snacks', 'budget', 'kirana'],
      helpfulCount: 64, commentCount: 1, helpfulBy: [patientIds[0], patientIds[1]],
      createdAt: daysAgo(4), updatedAt: daysAgo(4) },
    { authorId: patientIds[2], authorName: patientNames[2], category: 'Exercise',
      title: 'The 15-Minute Walk After Dinner That Changed My A1C',
      body: 'My doctor mentioned it in passing. Three months later, my A1C went from 8.1 to 6.9.\n\nI walk at a comfortable pace within 10 minutes of finishing my meal. The muscle contractions seem to pull glucose directly from the bloodstream.',
      tags: ['exercise', 'walking', 'a1c'],
      helpfulCount: 73, commentCount: 0, helpfulBy: [patientIds[0], patientIds[1]],
      createdAt: daysAgo(5), updatedAt: daysAgo(5) },
    { authorId: patientIds[0], authorName: patientNames[0], category: 'Snacks',
      title: 'Good Snack Options for Long Travel Days?',
      body: 'Flying next week with long transit. Everything at airports seems to be sugar bombs or unappetising. What do you all carry that packs well and does not need refrigeration?',
      tags: ['travel', 'snacks', 'airport'],
      helpfulCount: 12, commentCount: 0, helpfulBy: [],
      createdAt: daysAgo(2), updatedAt: daysAgo(2) },
    { authorId: patientIds[1], authorName: patientNames[1], category: 'Support',
      title: 'Two Years with T2D — What I Wish Someone Had Told Me',
      body: 'Nobody warns you about the emotional side. Managing blood sugar is one thing — managing the anxiety around every meal is another.\n\nWhat helped: accepting that glucose is not a report card. It is just data. Some days it will be higher. That does not mean you failed.',
      tags: ['newly-diagnosed', 'mental-health', 'support'],
      helpfulCount: 91, commentCount: 0, helpfulBy: [patientIds[0], patientIds[2]],
      createdAt: daysAgo(8), updatedAt: daysAgo(8) },
    { authorId: patientIds[2], authorName: patientNames[2], category: 'Support',
      title: 'Does Anyone Else Struggle with Festival Season?',
      body: 'The social pressure to eat sweets is immense. My relatives mean well but constantly offering mithai while knowing my condition is exhausting.\n\nHow do others handle this without making things awkward?',
      tags: ['festivals', 'social-situations'],
      helpfulCount: 37, commentCount: 0, helpfulBy: [patientIds[0]],
      createdAt: hoursAgo(18), updatedAt: hoursAgo(18) },
    { authorId: patientIds[1], authorName: patientNames[1], category: 'Tips & Tricks',
      title: 'The Plate Method — Simplest Way to Stop Counting Carbs',
      body: 'Half the plate: non-starchy vegetables. Quarter: protein. Quarter: complex carbs.\n\nNo apps, no weighing scales. Just visual proportions. My glucose control has been comparable to when I was tracking every gram.',
      tags: ['plate-method', 'meal-planning', 'tips'],
      helpfulCount: 55, commentCount: 0, helpfulBy: [patientIds[0], patientIds[2]],
      createdAt: daysAgo(3), updatedAt: daysAgo(3) },
    { authorId: patientIds[0], authorName: patientNames[0], category: 'Ask Community',
      title: 'Has Anyone Tried Intermittent Fasting with Metformin?',
      body: 'My doctor has not objected but mentioned to monitor carefully. I am on Metformin 500mg twice daily.\n\nHas anyone managed the medication timing around a 16:8 eating window? Not looking for medical advice — just real experiences.',
      tags: ['intermittent-fasting', 'metformin', 'question'],
      helpfulCount: 19, commentCount: 1, helpfulBy: [patientIds[2]],
      createdAt: hoursAgo(8), updatedAt: hoursAgo(8) },
  ];
}

// Comments use top-level collection with postId field — matches Firestore rules
function buildComments(patientIds, patientNames, postDocIds) {
  return [
    // 2 comments on Ragi Dosa post (index 0)
    { postId: postDocIds[0], authorId: patientIds[1], authorName: patientNames[1],
      text: 'Made this last Sunday! The fermentation really does make a difference. I added methi to the batter — supposed to help with glucose absorption.',
      createdAt: daysAgo(6) },
    { postId: postDocIds[0], authorId: patientIds[2], authorName: patientNames[2],
      text: 'Does this work with store-bought ragi flour or does it have to be freshly ground? I do not have a grinder at home.',
      createdAt: daysAgo(5) },
    // 1 comment on Kirana Snacks post (index 1)
    { postId: postDocIds[1], authorId: patientIds[1], authorName: patientNames[1],
      text: 'I would add roasted pumpkin seeds to this list — very filling and almost no effect on glucose in my experience.',
      createdAt: daysAgo(3) },
    // 1 comment on Intermittent Fasting post (index 7)
    { postId: postDocIds[7], authorId: patientIds[2], authorName: patientNames[2],
      text: 'I tried 16:8 for three months while on Metformin. I moved my doses to 12pm and 8pm with my eating window meals after checking with my doctor. Worked fine but the first week had some nausea.',
      createdAt: hoursAgo(4) },
  ];
}

// ─── Delete helpers ───────────────────────────────────────────────────────────

async function deleteCollection(collectionRef, batchSize = 400) {
  const snapshot = await collectionRef.limit(batchSize).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  if (snapshot.size === batchSize) await deleteCollection(collectionRef, batchSize);
}

async function deleteAuthUsers(uids) {
  if (uids.length === 0) return;
  const result = await auth.deleteUsers(uids);
  if (result.failureCount > 0) {
    result.errors.forEach(e => warn(`Could not delete UID ${e.index}: ${e.error.message}`));
  }
}

async function upsertAuthUser({ email, displayName }) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { displayName, password: DEMO_PASSWORD });
    return existing;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    return auth.createUser({ email, displayName, password: DEMO_PASSWORD });
  }
}

// ─── Main seed routine ────────────────────────────────────────────────────────

async function seed() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     ShareCare — Production Seed Script           ║');
  console.log(`║     Project: ${PROD_FIREBASE_PROJECT_ID.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════════╝');

  // ── 1. Clear existing data ────────────────────────────────────────────
  section('Step 1 of 6 — Clearing existing data');
  const existingUids = [];
  try {
    const usersSnap = await db.collection('users').get();
    usersSnap.docs.forEach(d => { if (d.data().isDemo) existingUids.push(d.id); });
    log(`Found ${existingUids.length} existing demo users to remove.`);
  } catch (e) { warn(`Could not read existing users: ${e.message}`); }

  for (const name of ['users', 'pharmacies', 'requests', 'posts', 'comments', 'reports']) {
    await deleteCollection(db.collection(name));
    ok(`Cleared: ${name}`);
  }
  await deleteAuthUsers(existingUids);
  if (existingUids.length > 0) ok(`Deleted ${existingUids.length} Auth demo accounts`);

  // ── 2. Create pharmacy accounts ───────────────────────────────────────
  section('Step 2 of 6 — Creating pharmacy accounts');
  const pharmacyIds = [];
  for (const p of PHARMACIES) {
    const user = await upsertAuthUser({ email: p.email, displayName: p.displayName });
    await db.collection('users').doc(user.uid).set({ uid: user.uid, email: p.email, name: p.displayName, role: 'pharmacy', isDemo: true, createdAt: p.pharmacy.createdAt });
    const pharmRef = await db.collection('pharmacies').add({ ownerId: user.uid, ...p.pharmacy });
    await db.collection('users').doc(user.uid).update({ pharmacyId: pharmRef.id });
    pharmacyIds.push(pharmRef.id);
    ok(`Pharmacy: ${p.displayName} (pharmacyId: ${pharmRef.id})`);
  }

  // ── 3. Create patient accounts ────────────────────────────────────────
  section('Step 3 of 6 — Creating patient accounts');
  const patientIds   = [];
  const patientNames = [];
  for (const p of PATIENTS) {
    const user = await upsertAuthUser({ email: p.email, displayName: p.displayName });
    await db.collection('users').doc(user.uid).set({ uid: user.uid, email: p.email, name: p.displayName, role: 'patient', isDemo: true, createdAt: p.createdAt });
    patientIds.push(user.uid);
    patientNames.push(p.displayName);
    ok(`Patient: ${p.displayName} (uid: ${user.uid})`);
  }

  // ── 4. Create medicine requests ───────────────────────────────────────
  section('Step 4 of 6 — Creating medicine requests');
  const requests = buildRequests(patientIds, pharmacyIds);
  for (const req of requests) {
    const ref = await db.collection('requests').add(req);
    ok(`Request [${req.status.padEnd(9)}] ${req.medicines[0].name} (id: ${ref.id})`);
  }

  // ── 5. Create community posts ─────────────────────────────────────────
  section('Step 5 of 6 — Creating community posts');
  const posts      = buildPosts(patientIds, patientNames);
  const postDocIds = [];
  for (const post of posts) {
    const ref = await db.collection('posts').add(post);
    postDocIds.push(ref.id);
    ok(`Post [${post.category.padEnd(14)}] "${post.title.slice(0, 45)}…" (id: ${ref.id})`);
  }

  // ── 6. Create comments ────────────────────────────────────────────────
  section('Step 6 of 6 — Creating comments');
  const comments = buildComments(patientIds, patientNames, postDocIds);
  for (const comment of comments) {
    const ref = await db.collection('comments').add(comment);
    ok(`Comment by ${comment.authorName} on post ${comment.postId} (id: ${ref.id})`);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ✓  Seed complete                                ║');
  console.log(`║     ${PHARMACIES.length} pharmacies  ${PATIENTS.length} patients  ${requests.length} requests          ║`);
  console.log(`║     ${posts.length} posts       ${comments.length} comments                    ║`);
  console.log('║                                                  ║');
  console.log('║  Demo password for all accounts: ShareCare@123   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });