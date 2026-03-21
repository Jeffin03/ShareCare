// community.js — ShareCare Community Feed Logic
// Firebase 10.12.0

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToPost(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}

function docToComment(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}


// ─── Posts ────────────────────────────────────────────────────────────────────

/**
 * getPosts(category, sortBy)
 * Fetch posts from Firestore, optionally filtered by category and sorted.
 *
 * @param {string|null} category — one of the pill categories, or null for All
 * @param {string}      sortBy   — 'recent' | 'helpful' | 'comments'
 * @returns {Promise<Array>}
 */
export async function getPosts(category = null, sortBy = "recent") {
  const sortField = sortBy === "helpful"
    ? "helpfulCount"
    : sortBy === "comments"
    ? "commentCount"
    : "createdAt";

  let q;

  if (category && category !== "All") {
    q = query(
      collection(db, "posts"),
      where("category", "==", category),
      orderBy(sortField, "desc")
    );
  } else {
    q = query(collection(db, "posts"), orderBy(sortField, "desc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map(docToPost);
}


/**
 * getPost(postId)
 * Fetch a single post by its Firestore document ID.
 *
 * @param {string} postId
 * @returns {Promise<Object|null>}
 */
export async function getPost(postId) {
  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) return null;
  return docToPost(snap);
}


/**
 * listenToPosts(category, callback)
 * Real-time listener for the community feed.
 *
 * @param {string|null} category — category filter, or null for All
 * @param {Function}    callback — called with (posts: Array) on every update
 * @returns {Function}           — unsubscribe function
 */
export function listenToPosts(category, callback) {
  let q;

  if (category && category !== "All") {
    q = query(
      collection(db, "posts"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  }

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToPost));
  });
}


/**
 * createPost(authorId, authorName, title, body, category, tags)
 * Add a new post to the posts collection.
 *
 * @returns {Promise<string>} — the new post's document ID
 */
export async function createPost(authorId, authorName, title, body, category, tags = []) {
  const ref = await addDoc(collection(db, "posts"), {
    authorId,
    authorName,
    title,
    body,
    category,
    tags,
    helpfulCount: 0,
    commentCount: 0,
    helpfulBy:    [],
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });
  return ref.id;
}


// ─── Helpful ──────────────────────────────────────────────────────────────────

/**
 * markHelpful(postId, userId)
 * Increment helpfulCount — idempotent, a user can only mark once.
 */
export async function markHelpful(postId, userId) {
  const postRef  = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) throw new Error(`Post ${postId} not found.`);

  const { helpfulBy = [] } = postSnap.data();
  if (helpfulBy.includes(userId)) return; // already marked

  await updateDoc(postRef, {
    helpfulCount: increment(1),
    helpfulBy:    arrayUnion(userId),
  });
}


// ─── Save / Unsave ────────────────────────────────────────────────────────────
// Uses saved/{userId}/posts/{postId} — matches Firestore rules

/**
 * savePost(userId, postId)
 */
export async function savePost(userId, postId) {
  const ref = doc(db, "saved", userId, "posts", postId);
  await setDoc(ref, { postId, savedAt: serverTimestamp() });
}

/**
 * unsavePost(userId, postId)
 */
export async function unsavePost(userId, postId) {
  const ref = doc(db, "saved", userId, "posts", postId);
  await deleteDoc(ref);
}

/**
 * isSaved(userId, postId)
 * @returns {Promise<boolean>}
 */
export async function isSaved(userId, postId) {
  const ref  = doc(db, "saved", userId, "posts", postId);
  const snap = await getDoc(ref);
  return snap.exists();
}

/**
 * getSavedPosts(userId)
 * Fetch all saved post IDs for a user.
 * @returns {Promise<string[]>}
 */
export async function getSavedPosts(userId) {
  const snap = await getDocs(collection(db, "saved", userId, "posts"));
  return snap.docs.map(d => d.id);
}


// ─── Comments ─────────────────────────────────────────────────────────────────
// Uses top-level comments collection with postId field — matches Firestore rules

/**
 * addComment(postId, authorId, authorName, text)
 * Add a comment and increment the post's commentCount.
 * @returns {Promise<string>} — the new comment's document ID
 */
export async function addComment(postId, authorId, authorName, text) {
  const [commentRef] = await Promise.all([
    addDoc(collection(db, "comments"), {
      postId,
      authorId,
      authorName,
      text,
      createdAt: serverTimestamp(),
    }),
    updateDoc(doc(db, "posts", postId), {
      commentCount: increment(1),
    }),
  ]);
  return commentRef.id;
}

/**
 * listenToComments(postId, callback)
 * Real-time listener for comments on a post, ordered by createdAt ascending.
 * @returns {Function} — unsubscribe function
 */
export function listenToComments(postId, callback) {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToComment));
  });
}


// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * reportPost(postId, reportedBy, reason)
 * Submit a report to the top-level reports collection.
 * @returns {Promise<string>} — the new report's document ID
 */
export async function reportPost(postId, reportedBy, reason) {
  const ref = await addDoc(collection(db, "reports"), {
    postId,
    reportedBy,
    reason,
    resolved:  false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCategoryLabel(category) {
  const labels = {
    'Recipes':       'Recipes',
    'Exercise':      'Exercise',
    'Snacks':        'Snacks',
    'Support':       'Support',
    'Tips & Tricks': 'Tips & Tricks',
    'Ask Community': 'Ask Community'
  };
  return labels[category] || 'General';
}

export function getCategoryIcon(category) {
  const icons = {
    'Recipes':       'ri-restaurant-line',
    'Exercise':      'ri-run-line',
    'Snacks':        'ri-snack-line',
    'Support':       'ri-heart-3-line',
    'Tips & Tricks': 'ri-lightbulb-line',
    'Ask Community': 'ri-question-answer-line'
  };
  return icons[category] || 'ri-apps-2-line';
}

export function formatHelpfulCount(count) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}