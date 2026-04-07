// ──────────────────────────────────────────────────────────────────────────────
// Integration Tests: Module + Firebase interactions
// ──────────────────────────────────────────────────────────────────────────────

import { TEST_USERS, TEST_REQUEST, TEST_POST, TEST_COMMENT } from './setup';
import * as auth from '../js/auth.js';
import * as patient from '../js/patient.js';
import * as pharmacy from '../js/pharmacy.js';
import * as community from '../js/community.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

describe('Integration Tests - Auth Module', () => {
  describe('User Registration & Profile Creation', () => {
    test('should create user account and profile in Firestore', async () => {
      const mockUser = { uid: TEST_USERS.PATIENT.uid };
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      setDoc.mockResolvedValueOnce();

      const result = await auth.signUp(
        TEST_USERS.PATIENT.name,
        TEST_USERS.PATIENT.email,
        'password123',
        TEST_USERS.PATIENT.role
      );

      expect(result.uid).toBe(TEST_USERS.PATIENT.uid);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        TEST_USERS.PATIENT.email,
        'password123'
      );
      expect(setDoc).toHaveBeenCalled();
    });

    test('should handle signup errors', async () => {
      createUserWithEmailAndPassword.mockRejectedValueOnce(
        new Error('Email already in use')
      );

      await expect(
        auth.signUp('Name', 'existing@example.com', 'password123', 'patient')
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('Login & Session Management', () => {
    test('should authenticate user and retrieve profile', async () => {
      const mockUser = { uid: TEST_USERS.PATIENT.uid };
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: TEST_USERS.PATIENT.name,
          email: TEST_USERS.PATIENT.email,
          role: TEST_USERS.PATIENT.role
        })
      });

      const result = await auth.logIn(
        TEST_USERS.PATIENT.email,
        'password123'
      );

      expect(result.uid).toBe(TEST_USERS.PATIENT.uid);
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests - Patient Module', () => {
  describe('Medicine Request Workflow', () => {
    test('should submit request and store in Firestore', async () => {
      const mockRef = { id: TEST_REQUEST.id };
      addDoc.mockResolvedValueOnce(mockRef);

      const requestId = await patient.submitRequest(
        TEST_REQUEST.patientId,
        TEST_REQUEST.patientName,
        TEST_REQUEST.pharmacyId,
        TEST_REQUEST.pharmacyName,
        TEST_REQUEST.medicines,
        TEST_REQUEST.notes,
        TEST_REQUEST.preferredPickupTime
      );

      expect(requestId).toBe(TEST_REQUEST.id);
      expect(addDoc).toHaveBeenCalled();
    });

    test('should fetch patient requests from Firestore', async () => {
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: TEST_REQUEST.id,
            data: () => TEST_REQUEST
          }
        ]
      });

      const requests = await patient.getPatientRequests(TEST_USERS.PATIENT.uid);

      expect(requests).toHaveLength(1);
      expect(requests[0].id).toBe(TEST_REQUEST.id);
      expect(requests[0].status).toBe('pending');
    });

    test('should cancel pending request', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'pending' })
      });
      updateDoc.mockResolvedValueOnce();

      await patient.cancelRequest(TEST_REQUEST.id);

      expect(updateDoc).toHaveBeenCalled();
    });

    test('should prevent cancellation of non-pending request', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'confirmed' })
      });

      await expect(
        patient.cancelRequest(TEST_REQUEST.id)
      ).rejects.toThrow('Only pending requests can be cancelled');
    });
  });
});

describe('Integration Tests - Pharmacy Module', () => {
  describe('Order Management', () => {
    test('should fetch pharmacy orders from Firestore', async () => {
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: TEST_REQUEST.id,
            data: () => TEST_REQUEST
          }
        ]
      });

      const orders = await pharmacy.getPharmacyOrders(TEST_USERS.PHARMACY.uid);

      expect(orders).toBeDefined();
    });

    test('should update order status with validation', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'pending' })
      });
      updateDoc.mockResolvedValueOnce();

      await pharmacy.updateOrderStatus(TEST_REQUEST.id, 'confirmed');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ status: 'confirmed' })
      );
    });

    test('should prevent invalid status transitions', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'pending' })
      });

      await expect(
        pharmacy.updateOrderStatus(TEST_REQUEST.id, 'collected')
      ).rejects.toThrow();
    });
  });
});

describe('Integration Tests - Community Module', () => {
  describe('Post & Comment Workflow', () => {
    test('should create post and store in Firestore', async () => {
      const mockRef = { id: TEST_POST.id };
      addDoc.mockResolvedValueOnce(mockRef);

      const postId = await community.createPost(
        TEST_POST.authorId,
        TEST_POST.authorName,
        TEST_POST.category,
        TEST_POST.title,
        TEST_POST.content
      );

      expect(postId).toBe(TEST_POST.id);
      expect(addDoc).toHaveBeenCalled();
    });

    test('should add comment and increment count', async () => {
      const mockCommentRef = { id: TEST_COMMENT.id };
      addDoc.mockResolvedValueOnce(mockCommentRef);
      updateDoc.mockResolvedValueOnce();

      const commentId = await community.addComment(
        TEST_POST.id,
        TEST_COMMENT.authorId,
        TEST_COMMENT.authorName,
        TEST_COMMENT.text
      );

      expect(commentId).toBe(TEST_COMMENT.id);
      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    test('should save post to user collection', async () => {
      setDoc.mockResolvedValueOnce();

      await community.savePost(TEST_USERS.PATIENT.uid, TEST_POST.id);

      expect(setDoc).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests - Cross-Module Scenarios', () => {
  test('Complete flow: Patient submits request → Pharmacy receives → Updates status', async () => {
    // Step 1: Patient submits request
    addDoc.mockResolvedValueOnce({ id: TEST_REQUEST.id });
    const requestId = await patient.submitRequest(
      TEST_REQUEST.patientId,
      TEST_REQUEST.patientName,
      TEST_REQUEST.pharmacyId,
      TEST_REQUEST.pharmacyName,
      TEST_REQUEST.medicines,
      TEST_REQUEST.notes,
      TEST_REQUEST.preferredPickupTime
    );
    expect(requestId).toBe(TEST_REQUEST.id);

    // Step 2: Pharmacy fetches request
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => TEST_REQUEST
    });
    const order = await pharmacy.getOrder(requestId);
    expect(order).toBeDefined();

    // Step 3: Pharmacy updates status
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...TEST_REQUEST, status: 'pending' })
    });
    updateDoc.mockResolvedValueOnce();
    await pharmacy.updateOrderStatus(requestId, 'confirmed');
    expect(updateDoc).toHaveBeenCalled();
  });
});