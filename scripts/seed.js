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
 *   PROD_FIREBASE_DATABASE_URL     (optional — only needed if using RTDB)
 *
 * Usage:
 *   PROD_FIREBASE_PROJECT_ID=... \
 *   PROD_FIREBASE_CLIENT_EMAIL=... \
 *   PROD_FIREBASE_PRIVATE_KEY=... \
 *   node scripts/seed.js
 *
 * Or via npm:
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
     // CI stores the key with literal \n — restore real newlines
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
 
 function daysAgo(n) {
   return Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));
 }
 
 function hoursAgo(n) {
   return Timestamp.fromDate(new Date(Date.now() - n * 3_600_000));
 }
 
 // ─── Demo data definitions ────────────────────────────────────────────────────
 
 const DEMO_PASSWORD = 'ShareCare@123';
 
 const PHARMACIES = [
   {
     email:       'apollo.demo@sharecare.app',
     displayName: 'Apollo Pharmacy — Jaipur',
     pharmacy: {
       name:    'Apollo Pharmacy',
       branch:  'MI Road, Jaipur',
       phone:   '+91-141-2345678',
       address: '12, MI Road, Jaipur, Rajasthan 302001',
       active:  true,
       createdAt: daysAgo(60),
     },
   },
   {
     email:       'medplus.demo@sharecare.app',
     displayName: 'MedPlus Health — Vaishali Nagar',
     pharmacy: {
       name:    'MedPlus Health',
       branch:  'Vaishali Nagar, Jaipur',
       phone:   '+91-141-2987654',
       address: '7, Vaishali Nagar, Jaipur, Rajasthan 302021',
       active:  true,
       createdAt: daysAgo(45),
     },
   },
 ];
 
 const PATIENTS = [
   {
     email:       'priya.demo@sharecare.app',
     displayName: 'Priya Sharma',
     profile: {
       name:      'Priya Sharma',
       age:       38,
       condition: 'Type 2 Diabetes',
       phone:     '+91-98765-43210',
       createdAt: daysAgo(30),
     },
   },
   {
     email:       'suresh.demo@sharecare.app',
     displayName: 'Suresh Iyer',
     profile: {
       name:      'Suresh Iyer',
       age:       54,
       condition: 'Type 2 Diabetes',
       phone:     '+91-98765-11111',
       createdAt: daysAgo(25),
     },
   },
   {
     email:       'anita.demo@sharecare.app',
     displayName: 'Anita Verma',
     profile: {
       name:      'Anita Verma',
       age:       45,
       condition: 'Type 2 Diabetes',
       phone:     '+91-98765-22222',
       createdAt: daysAgo(20),
     },
   },
 ];
 
 // Requests are built after patient UIDs are known.
 function buildRequests(patientIds, pharmacyIds) {
   return [
     {
       patientId:   patientIds[0],
       pharmacyId:  pharmacyIds[0],
       medicines:   ['Metformin 500mg × 60', 'Glipizide 5mg × 30'],
       notes:       'Please include a copy of the updated dosage instructions.',
       status:      'collected',
       delivery:    'pickup',
       createdAt:   daysAgo(14),
       updatedAt:   daysAgo(10),
     },
     {
       patientId:   patientIds[0],
       pharmacyId:  pharmacyIds[0],
       medicines:   ['Metformin 500mg × 60'],
       notes:       '',
       status:      'ready',
       delivery:    'pickup',
       createdAt:   daysAgo(3),
       updatedAt:   daysAgo(1),
     },
     {
       patientId:   patientIds[1],
       pharmacyId:  pharmacyIds[0],
       medicines:   ['Januvia 100mg × 30', 'Aspirin 75mg × 30'],
       notes:       'Urgent — running low.',
       status:      'confirmed',
       delivery:    'delivery',
       createdAt:   daysAgo(2),
       updatedAt:   hoursAgo(6),
     },
     {
       patientId:   patientIds[2],
       pharmacyId:  pharmacyIds[1],
       medicines:   ['Insulin Glargine (Lantus) 100U/mL × 2 vials'],
       notes:       'Keep refrigerated during delivery.',
       status:      'pending',
       delivery:    'delivery',
       createdAt:   hoursAgo(5),
       updatedAt:   hoursAgo(5),
     },
     {
       patientId:   patientIds[1],
       pharmacyId:  pharmacyIds[1],
       medicines:   ['Sitagliptin 50mg × 30', 'Atorvastatin 10mg × 30'],
       notes:       '',
       status:      'pending',
       delivery:    'pickup',
       createdAt:   hoursAgo(2),
       updatedAt:   hoursAgo(2),
     },
   ];
 }
 
 // Posts are built after patient UIDs are known.
 function buildPosts(patientIds, patientNames) {
   return [
     // Recipes (2)
     {
       authorId:     patientIds[0],
       authorName:   patientNames[0],
       category:     'Recipes',
       title:        'Low-GI Ragi Dosa — My Sunday Morning Staple',
       body:         'Swapped regular rice dosa with a ragi-oats blend and it changed my post-breakfast glucose numbers completely.\n\nMix 1 cup ragi flour, ½ cup oats (ground), 2 tbsp urad dal (soaked overnight). Ferment for 6–8 hrs. Cook on a cast iron tawa with minimal oil.\n\nMy CGM shows a peak of 148 mg/dL instead of the usual 190+ with regular dosa. If you try this, let me know what you think!',
       tags:         ['ragi', 'low-gi', 'breakfast', 'recipe'],
       helpfulCount: 48,
       commentCount: 2,
       helpfulBy:    [patientIds[1], patientIds[2]],
       createdAt:    daysAgo(7),
       updatedAt:    daysAgo(7),
     },
     {
       authorId:     patientIds[2],
       authorName:   patientNames[2],
       category:     'Recipes',
       title:        '5 Diabetes-Friendly Snacks from Any Kirana Store',
       body:         'You do not need a speciality health store or expensive superfoods. Here is what I keep at home, all available at any local kirana:\n\n1. Roasted chana — ₹20/pack, high protein, low GI\n2. Fox nuts (makhana) — light, filling, barely raises glucose\n3. Peanuts — a small fistful is a perfect mid-morning snack\n4. Cucumber + lime — practically zero carbs\n5. Sprouted moong — easy to make at home over 2 days\n\nAll under ₹30 per serving. Do you have any other kirana-store finds?',
       tags:         ['snacks', 'budget', 'kirana', 'low-gi'],
       helpfulCount: 64,
       commentCount: 1,
       helpfulBy:    [patientIds[0], patientIds[1]],
       createdAt:    daysAgo(4),
       updatedAt:    daysAgo(4),
     },
 
     // Exercise (1)
     {
       authorId:     patientIds[2],
       authorName:   patientNames[2],
       category:     'Exercise',
       title:        'The 15-Minute Walk After Dinner That Changed My A1C',
       body:         'My doctor mentioned it in passing and I honestly dismissed it. A 15-minute walk after dinner — how much difference could it make?\n\nThree months later, my A1C went from 8.1 to 6.9.\n\nI walk at a comfortable pace, no gym shoes required. The timing matters more than the intensity — I aim to start within 10 minutes of finishing the meal. The muscle contractions seem to pull glucose directly from the bloodstream without needing insulin.\n\nHas anyone else noticed a difference with post-meal movement?',
       tags:         ['exercise', 'walking', 'a1c', 'post-meal'],
       helpfulCount: 73,
       commentCount: 0,
       helpfulBy:    [patientIds[0], patientIds[1]],
       createdAt:    daysAgo(5),
       updatedAt:    daysAgo(5),
     },
 
     // Snacks (1)
     {
       authorId:     patientIds[0],
       authorName:   patientNames[0],
       category:     'Snacks',
       title:        'Good Snack Options for Long Travel Days?',
       body:         'Flying to Mumbai next week — 2.5 hour flight, then 90 minutes in transit before a connecting train.\n\nEverything at airports seems to be either sugar bombs (muffins, sandwiches with white bread) or plain unappetising.\n\nWhat do you all carry? I am thinking roasted chana and a banana, but would love more ideas. Especially anything that packs well and does not need refrigeration.',
       tags:         ['travel', 'snacks', 'airport'],
       helpfulCount: 12,
       commentCount: 0,
       helpfulBy:    [],
       createdAt:    daysAgo(2),
       updatedAt:    daysAgo(2),
     },
 
     // Support (2)
     {
       authorId:     patientIds[1],
       authorName:   patientNames[1],
       category:     'Support',
       title:        'Two Years with T2D — What I Wish Someone Had Told Me',
       body:         'Nobody warns you about the emotional side. Managing blood sugar is one thing — managing the anxiety around every single meal is another.\n\nThe first six months, I obsessed over every number. A reading of 160 would ruin my evening. I became irritable with my family.\n\nWhat helped: accepting that glucose is not a report card. It is just data. Some days it will be higher. That does not mean you failed.\n\nIf you are newly diagnosed and feeling overwhelmed, I want you to know it genuinely gets easier. The habits become automatic. The fear fades.\n\nFeel free to reach out in the comments — happy to share more.',
       tags:         ['newly-diagnosed', 'mental-health', 'anxiety', 'support'],
       helpfulCount: 91,
       commentCount: 0,
       helpfulBy:    [patientIds[0], patientIds[2]],
       createdAt:    daysAgo(8),
       updatedAt:    daysAgo(8),
     },
     {
       authorId:     patientIds[2],
       authorName:   patientNames[2],
       category:     'Support',
       title:        'Does Anyone Else Struggle with Festival Season?',
       body:         'Diwali, Holi, weddings — the social pressure to eat sweets is immense. My relatives mean well but constantly offering mithai while knowing my condition makes it exhausting.\n\nI have started saying "I am full" rather than explaining diabetes every time because the lecture that follows ("but just one small piece will not hurt!") is more draining than politely declining.\n\nHow do others handle this? Any scripts or strategies that have worked for you without making things awkward?',
       tags:         ['festivals', 'social-situations', 'sweets'],
       helpfulCount: 37,
       commentCount: 0,
       helpfulBy:    [patientIds[0]],
       createdAt:    hoursAgo(18),
       updatedAt:    hoursAgo(18),
     },
 
     // Tips & Tricks (1)
     {
       authorId:     patientIds[1],
       authorName:   patientNames[1],
       category:     'Tips & Tricks',
       title:        'The Plate Method — Simplest Way to Stop Counting Carbs',
       body:         'I spent months obsessing over carb counts and weighing everything. It was unsustainable.\n\nMy dietitian introduced me to the plate method and it clicked immediately:\n\n• Half the plate: non-starchy vegetables (salad, sabzi, cucumber)\n• Quarter of the plate: protein (dal, paneer, eggs, chicken)\n• Quarter of the plate: complex carbs (brown rice, roti, millets)\n\nNo apps, no weighing scales. Just visual proportions. My glucose control has been comparable to when I was tracking every gram, but with a fraction of the mental effort.\n\nWorth trying if you find tracking exhausting.',
       tags:         ['plate-method', 'meal-planning', 'tips', 'beginner'],
       helpfulCount: 55,
       commentCount: 0,
       helpfulBy:    [patientIds[0], patientIds[2]],
       createdAt:    daysAgo(3),
       updatedAt:    daysAgo(3),
     },
     {
       authorId:     patientIds[0],
       authorName:   patientNames[0],
       category:     'Ask Community',
       title:        'Has Anyone Tried Intermittent Fasting with Metformin?',
       body:         'My doctor has not objected to me trying a 16:8 eating window but mentioned to monitor carefully. I am on Metformin 500mg twice daily.\n\nI have read conflicting things online — some people say it works well, others say the timing interacts badly with the medication since it should be taken with food.\n\nHas anyone here done this? How did you manage the medication timing? I am not looking for medical advice, just real experiences.',
       tags:         ['intermittent-fasting', 'metformin', 'question'],
       helpfulCount: 19,
       commentCount: 1,
       helpfulBy:    [patientIds[2]],
       createdAt:    hoursAgo(8),
       updatedAt:    hoursAgo(8),
     },
   ];
 }
 
 function buildComments(patientIds, patientNames, postIndexMap) {
   // postIndexMap: { postIndex: firestoreDocId }
   // Returns array of { postId, comment } objects
   return [
     // 2 comments on the Ragi Dosa post (index 0)
     {
       postIndex: 0,
       comment: {
         authorId:   patientIds[1],
         authorName: patientNames[1],
         text:       'Made this last Sunday! The fermentation really does make a difference. I added a little methi (fenugreek) to the batter — it is supposed to help with glucose absorption and the slight bitterness works well with coconut chutney.',
         createdAt:  daysAgo(6),
       },
     },
     {
       postIndex: 0,
       comment: {
         authorId:   patientIds[2],
         authorName: patientNames[2],
         text:       'Does this work with store-bought ragi flour or does it have to be freshly ground? I do not have a grinder at home.',
         createdAt:  daysAgo(5),
       },
     },
 
     // 1 comment on the Kirana Snacks post (index 1)
     {
       postIndex: 1,
       comment: {
         authorId:   patientIds[1],
         authorName: patientNames[1],
         text:       'I would add roasted pumpkin seeds to this list — most kirana stores near me stock them now, very filling and almost no effect on glucose in my experience.',
         createdAt:  daysAgo(3),
       },
     },
 
     // 1 comment on the Intermittent Fasting post (index 7)
     {
       postIndex: 7,
       comment: {
         authorId:   patientIds[2],
         authorName: patientNames[2],
         text:       'I tried 16:8 for three months while on Metformin. I moved my doses to 12 pm and 8 pm (with my eating window meals) after checking with my doctor. Worked fine for me but the first week of the fasting window I had some nausea — probably adjustment. Not a substitute for talking to your doctor but just my experience.',
         createdAt:  hoursAgo(4),
       },
     },
   ];
 }
 
 // ─── Delete helpers ───────────────────────────────────────────────────────────
 
 /**
  * Delete all documents in a collection, including sub-collections.
  * Processes in batches of 400 to stay within Firestore limits.
  */
 async function deleteCollection(collectionRef, batchSize = 400) {
   const snapshot = await collectionRef.limit(batchSize).get();
   if (snapshot.empty) return;
 
   const batch = db.batch();
   snapshot.docs.forEach(doc => batch.delete(doc.ref));
   await batch.commit();
 
   if (snapshot.size === batchSize) {
     await deleteCollection(collectionRef, batchSize);
   }
 }
 
 /**
  * Delete a list of Auth users by UID, ignoring "user not found" errors.
  */
 async function deleteAuthUsers(uids) {
   if (uids.length === 0) return;
   const result = await auth.deleteUsers(uids);
   if (result.failureCount > 0) {
     result.errors.forEach(e => warn(`Could not delete UID ${e.index}: ${e.error.message}`));
   }
 }
 
 // ─── Create helpers ───────────────────────────────────────────────────────────
 
 /**
  * Upsert a Firebase Auth user (create or update if email already exists).
  * Returns the UserRecord.
  */
 async function upsertAuthUser({ email, displayName, role }) {
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
 
   // ── 1. Clear existing data ─────────────────────────────────────────────
 
   section('Step 1 of 6 — Clearing existing data');
 
   // Collect existing demo UIDs from Firestore so we can delete Auth accounts
   const existingUids = [];
   try {
     const usersSnap = await db.collection('users').get();
     usersSnap.docs.forEach(d => {
       if (d.data().isDemo) existingUids.push(d.id);
     });
     log(`Found ${existingUids.length} existing demo users to remove.`);
   } catch (e) {
     warn(`Could not read existing users: ${e.message}`);
   }
 
   // Delete Firestore collections
   const collections = ['users', 'pharmacies', 'requests', 'posts', 'reports'];
   for (const name of collections) {
     await deleteCollection(db.collection(name));
     ok(`Cleared: ${name}`);
   }
 
   // Delete Auth accounts
   await deleteAuthUsers(existingUids);
   if (existingUids.length > 0) ok(`Deleted ${existingUids.length} Auth demo accounts`);
 
   // ── 2. Create pharmacy accounts ────────────────────────────────────────
 
   section('Step 2 of 6 — Creating pharmacy accounts');
 
   const pharmacyIds = [];
 
   for (const p of PHARMACIES) {
     const user = await upsertAuthUser({ email: p.email, displayName: p.displayName, role: 'pharmacy' });
 
     // users/{uid}
     await db.collection('users').doc(user.uid).set({
       uid:         user.uid,
       email:       p.email,
       name:        p.displayName,
       role:        'pharmacy',
       isDemo:      true,
       createdAt:   p.pharmacy.createdAt,
     });
 
     // pharmacies/{uid}
     const pharmacyRef = await db.collection('pharmacies').add({
       ownerId:   user.uid,
       ...p.pharmacy,
     });
 
     pharmacyIds.push(pharmacyRef.id);
     ok(`Pharmacy: ${p.displayName} (uid: ${user.uid}, pharmacyId: ${pharmacyRef.id})`);
   }
 
   // ── 3. Create patient accounts ─────────────────────────────────────────
 
   section('Step 3 of 6 — Creating patient accounts');
 
   const patientIds   = [];
   const patientNames = [];
 
   for (const p of PATIENTS) {
     const user = await upsertAuthUser({ email: p.email, displayName: p.displayName, role: 'patient' });
 
     await db.collection('users').doc(user.uid).set({
       uid:       user.uid,
       email:     p.email,
       name:      p.displayName,
       role:      'patient',
       isDemo:    true,
       ...p.profile,
     });
 
     patientIds.push(user.uid);
     patientNames.push(p.displayName);
     ok(`Patient: ${p.displayName} (uid: ${user.uid})`);
   }
 
   // ── 4. Create medicine requests ────────────────────────────────────────
 
   section('Step 4 of 6 — Creating medicine requests');
 
   const requests = buildRequests(patientIds, pharmacyIds);
 
   for (const req of requests) {
     const ref = await db.collection('requests').add(req);
     ok(`Request [${req.status.padEnd(9)}] medicines: ${req.medicines[0]}${req.medicines.length > 1 ? ` +${req.medicines.length - 1} more` : ''} (id: ${ref.id})`);
   }
 
   // ── 5. Create community posts ──────────────────────────────────────────
 
   section('Step 5 of 6 — Creating community posts');
 
   const posts     = buildPosts(patientIds, patientNames);
   const postDocIds = [];
 
   for (const post of posts) {
     const ref = await db.collection('posts').add(post);
     postDocIds.push(ref.id);
     ok(`Post [${post.category.padEnd(14)}] "${post.title.slice(0, 50)}${post.title.length > 50 ? '…' : ''}" (id: ${ref.id})`);
   }
 
   // ── 6. Create comments ─────────────────────────────────────────────────
 
   section('Step 6 of 6 — Creating comments');
 
   const comments = buildComments(patientIds, patientNames);
 
   for (const { postIndex, comment } of comments) {
     const postId = postDocIds[postIndex];
     if (!postId) {
       warn(`No post at index ${postIndex} — skipping comment.`);
       continue;
     }
     const ref = await db.collection('posts').doc(postId).collection('comments').add(comment);
     ok(`Comment by ${comment.authorName} on post[${postIndex}] (id: ${ref.id})`);
   }
 
   // ── Summary ────────────────────────────────────────────────────────────
 
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
 
 // ─── Run ──────────────────────────────────────────────────────────────────────
 
 seed()
   .then(() => process.exit(0))
   .catch(err => {
     console.error('\n❌  Seed failed:', err.message);
     console.error(err.stack);
     process.exit(1);
   });