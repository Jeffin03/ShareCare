// ──────────────────────────────────────────────────────────────────────────────
// Global test setup and configuration
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Mock Firebase modules for testing
 */
jest.mock('../js/firebase-config.js', () => ({
  auth: {
    currentUser: null,
  },
  db: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn(val => ({ _type: 'increment', value: val }))
}));

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn()
}));

// Global test data
export const TEST_USERS = {
  PATIENT: {
    uid: 'patient-123',
    name: 'John Patient',
    email: 'patient@example.com',
    role: 'patient',
    createdAt: new Date('2026-01-01')
  },
  PHARMACY: {
    uid: 'pharmacy-456',
    name: 'Best Pharmacy',
    email: 'pharmacy@example.com',
    role: 'pharmacy',
    createdAt: new Date('2026-01-01')
  }
};

export const TEST_REQUEST = {
  id: 'request-789',
  patientId: 'patient-123',
  patientName: 'John Patient',
  pharmacyId: 'pharmacy-456',
  pharmacyName: 'Best Pharmacy',
  medicines: [
    { name: 'Metformin', quantity: 2 },
    { name: 'Glipizide', quantity: 1 }
  ],
  notes: 'Please deliver in the morning',
  preferredPickupTime: '10:00 AM',
  status: 'pending',
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01')
};

export const TEST_POST = {
  id: 'post-101',
  authorId: 'patient-123',
  authorName: 'John Patient',
  category: 'Recipes',
  title: 'Healthy Diabetes Breakfast Recipe',
  content: 'This is a great recipe for managing diabetes...',
  helpfulCount: 5,
  commentCount: 2,
  createdAt: new Date('2026-04-01')
};

export const TEST_COMMENT = {
  id: 'comment-102',
  postId: 'post-101',
  authorId: 'patient-456',
  authorName: 'Jane User',
  text: 'This is very helpful!',
  createdAt: new Date('2026-04-02')
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});