// community.js — ShareCare Community Feed Logic
// Firebase 10.12.0

import {
    getFirestore,
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
  
  import { app } from "./env.js";
  
  const db = getFirestore(app);
  
  // ─── Collection References ───────────────────────────────────────────────────
  
  const postsCol      = () => collection(db, "posts");
  const commentsCol   = (postId) => collection(db, "posts", postId, "comments");
  const reportsCol    = () => collection(db, "reports");
  const savedCol      = (userId) => collection(db, "users", userId, "savedPosts");
  
  // ─── Helpers ─────────────────────────────────────────────────────────────────
  
  /**
   * Map a Firestore DocumentSnapshot to a plain post object.
   */
  function docToPost(docSnap) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  
  // ─── Public API ──────────────────────────────────────────────────────────────
  
  /**
   * getPosts(category, sortBy)
   * Fetch posts from Firestore, optionally filtered by category and sorted.
   *
   * @param {string|null} category  — one of the pill categories, or null/'' for All
   * @param {string}      sortBy    — 'recent' (default) | 'helpful' | 'comments'
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
        postsCol(),
        where("category", "==", category),
        orderBy(sortField, "desc")
      );
    } else {
      q = query(postsCol(), orderBy(sortField, "desc"));
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
   * createPost(authorId, authorName, title, body, category, tags)
   * Add a new post document to the posts collection.
   *
   * @param {string}   authorId
   * @param {string}   authorName
   * @param {string}   title
   * @param {string}   body
   * @param {string}   category   — must match a valid pill category
   * @param {string[]} tags       — optional array of tag strings
   * @returns {Promise<string>}   — the new post's document ID
   */
  export async function createPost(
    authorId,
    authorName,
    title,
    body,
    category,
    tags = []
  ) {
    const ref = await addDoc(postsCol(), {
      authorId,
      authorName,
      title,
      body,
      category,
      tags,
      helpfulCount:  0,
      commentCount:  0,
      helpfulBy:     [],
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
    });
    return ref.id;
  }
  
  /**
   * markHelpful(postId, userId)
   * Increment helpfulCount on a post. Idempotent — a user can only count once.
   * Stores userId in helpfulBy array to prevent duplicate increments client-side.
   *
   * @param {string} postId
   * @param {string} userId
   * @returns {Promise<void>}
   */
  export async function markHelpful(postId, userId) {
    const postRef  = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
  
    if (!postSnap.exists()) throw new Error(`Post ${postId} not found.`);
  
    const { helpfulBy = [] } = postSnap.data();
    if (helpfulBy.includes(userId)) return; // already marked helpful
  
    await updateDoc(postRef, {
      helpfulCount: increment(1),
      helpfulBy:    arrayUnion(userId),
    });
  }
  
  /**
   * savePost(userId, postId)
   * Save a post to the user's savedPosts sub-collection.
   *
   * @param {string} userId
   * @param {string} postId
   * @returns {Promise<void>}
   */
  export async function savePost(userId, postId) {
    const ref = doc(db, "users", userId, "savedPosts", postId);
    await setDoc(ref, { postId, savedAt: serverTimestamp() });
  }
  
  /**
   * unsavePost(userId, postId)
   * Remove a post from the user's savedPosts sub-collection.
   *
   * @param {string} userId
   * @param {string} postId
   * @returns {Promise<void>}
   */
  export async function unsavePost(userId, postId) {
    const ref = doc(db, "users", userId, "savedPosts", postId);
    await deleteDoc(ref);
  }
  
  /**
   * isSaved(userId, postId)
   * Check whether a post is saved by the given user.
   *
   * @param {string} userId
   * @param {string} postId
   * @returns {Promise<boolean>}
   */
  export async function isSaved(userId, postId) {
    const ref  = doc(db, "users", userId, "savedPosts", postId);
    const snap = await getDoc(ref);
    return snap.exists();
  }
  
  /**
   * addComment(postId, authorId, authorName, text)
   * Add a comment document to the post's comments sub-collection
   * and increment the post's commentCount.
   *
   * @param {string} postId
   * @param {string} authorId
   * @param {string} authorName
   * @param {string} text
   * @returns {Promise<string>}  — the new comment's document ID
   */
  export async function addComment(postId, authorId, authorName, text) {
    const [commentRef] = await Promise.all([
      addDoc(commentsCol(postId), {
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
   * reportPost(postId, reportedBy, reason)
   * Submit a report document to the top-level reports collection.
   *
   * @param {string} postId
   * @param {string} reportedBy  — userId of the reporter
   * @param {string} reason      — free-text reason
   * @returns {Promise<string>}  — the new report's document ID
   */
  export async function reportPost(postId, reportedBy, reason) {
    const ref = await addDoc(reportsCol(), {
      postId,
      reportedBy,
      reason,
      resolved:  false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }
  
  /**
   * listenToPosts(category, callback)
   * Real-time listener for the community feed, optionally filtered by category.
   * Posts are always ordered by createdAt descending (newest first).
   *
   * @param {string|null} category  — category filter, or null/'' for All
   * @param {Function}    callback  — called with (posts: Array) on every update
   * @returns {Function}            — unsubscribe function; call to stop listening
   */
  export function listenToPosts(category, callback) {
    let q;
  
    if (category && category !== "All") {
      q = query(
        postsCol(),
        where("category", "==", category),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(postsCol(), orderBy("createdAt", "desc"));
    }
  
    const unsubscribe = onSnapshot(q, (snap) => {
      const posts = snap.docs.map(docToPost);
      callback(posts);
    });
  
    return unsubscribe;
  }