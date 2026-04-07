// ──────────────────────────────────────────────────────────────────────────────
// UAT (User Acceptance Tests): Real-world user scenarios
// ──────────────────────────────────────────────────────────────────────────────

import { TEST_USERS, TEST_REQUEST, TEST_POST } from './setup';
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
  setDoc
} from 'firebase/firestore';

describe('UAT - Patient User Workflows', () => {
  describe('Scenario: Patient discovers and requests medicines', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('Patient can sign up and create account', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: TEST_USERS.PATIENT.uid }
      });
      setDoc.mockResolvedValueOnce();

      const user = await auth.signUp(
        'Alice Patient',
        'alice@example.com',
        'SecurePass123!',
        'patient'
      );

      expect(user.uid).toBeDefined();
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Alice Patient',
          email: 'alice@example.com',
          role: 'patient'
        })
      );
    });

    test('Patient can view available pharmacies', async () => {
      const mockPharmacies = [
        { id: 'pharmacy-1', name: 'Best Pharmacy', city: 'New York' },
        { id: 'pharmacy-2', name: 'Quick Pharmacy', city: 'Boston' }
      ];

      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: mockPharmacies.map(p => ({
          id: p.id,
          data: () => p
        }))
      });

      const pharmacies = await patient.getPharmacies();

      expect(pharmacies).toHaveLength(2);
      expect(pharmacies[0].name).toBe('Best Pharmacy');
    });

    test('Patient can submit medicine request with validation', async () => {
      const medicines = [
        { name: 'Metformin', quantity: 2 },
        { name: 'Glipizide', quantity: 1 }
      ];

      // Validate medicines
      const errors = patient.validateMedicines(medicines);
      expect(errors).toHaveLength(0);

      // Submit request
      addDoc.mockResolvedValueOnce({ id: 'req-new-123' });

      const requestId = await patient.submitRequest(
        TEST_USERS.PATIENT.uid,
        TEST_USERS.PATIENT.name,
        'pharmacy-1',
        'Best Pharmacy',
        medicines,
        'Urgent needed',
        '2:00 PM'
      );

      expect(requestId).toBe('req-new-123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          medicines: medicines,
          status: 'pending'
        })
      );
    });

    test('Patient sees error when submitting invalid medicines', async () => {
      const invalidMedicines = [
        { name: '', quantity: 1 }
      ];

      const errors = patient.validateMedicines(invalidMedicines);

      expect(errors).toContain('Medicine 1: name is required.');
    });

    test('Patient can track request status in real-time', async () => {
      const statusUpdates = ['pending', 'confirmed', 'ready', 'collected'];
      let currentStatus = 0;

      getDoc.mockImplementation(() => {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            ...TEST_REQUEST,
            status: statusUpdates[currentStatus]
          })
        });
      });

      for (let i = 0; i < statusUpdates.length; i++) {
        currentStatus = i;
        const request = await patient.getRequest(TEST_REQUEST.id);
        expect(patient.getStatusLabel(request.status)).toBeDefined();
      }

      expect(patient.getStatusLabel('pending')).toBe('Pending');
      expect(patient.getStatusLabel('ready')).toBe('Ready for pickup');
      expect(patient.getStatusLabel('collected')).toBe('Collected');
    });

    test('Patient can cancel pending request only', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'pending' })
      });
      updateDoc.mockResolvedValueOnce();

      await patient.cancelRequest(TEST_REQUEST.id);
      expect(updateDoc).toHaveBeenCalled();
    });

    test('Patient cannot cancel confirmed request', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'confirmed' })
      });

      await expect(
        patient.cancelRequest(TEST_REQUEST.id)
      ).rejects.toThrow();
    });
  });
});

describe('UAT - Pharmacy User Workflows', () => {
  describe('Scenario: Pharmacy receives and fulfills orders', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('Pharmacy can view all pending orders', async () => {
      getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'order-1', data: () => ({ ...TEST_REQUEST, status: 'pending' }) },
          { id: 'order-2', data: () => ({ ...TEST_REQUEST, status: 'pending' }) }
        ]
      });

      const orders = await pharmacy.getPharmacyOrders(TEST_USERS.PHARMACY.uid);

      expect(orders).toBeDefined();
    });

    test('Pharmacy can confirm order and add notes', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'pending' })
      });
      updateDoc.mockResolvedValueOnce();

      await pharmacy.updateOrderStatus(
        TEST_REQUEST.id,
        'confirmed',
        'Order confirmed. Will prepare medicine.'
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'confirmed',
          pharmacyNotes: 'Order confirmed. Will prepare medicine.'
        })
      );
    });

    test('Pharmacy can mark order as ready for pickup', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'confirmed' })
      });
      updateDoc.mockResolvedValueOnce();

      await pharmacy.updateOrderStatus(TEST_REQUEST.id, 'ready');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ status: 'ready' })
      );
    });

    test('Pharmacy follows valid status transitions', async () => {
      const validTransitions = [
        { from: 'pending', to: 'confirmed' },
        { from: 'pending', to: 'cancelled' },
        { from: 'confirmed', to: 'ready' },
        { from: 'ready', to: 'collected' }
      ];

      for (const transition of validTransitions) {
        getDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ...TEST_REQUEST, status: transition.from })
        });
        updateDoc.mockResolvedValueOnce();

        await pharmacy.updateOrderStatus(TEST_REQUEST.id, transition.to);
        expect(updateDoc).toHaveBeenCalled();
      }
    });

    test('Pharmacy cannot make invalid status transitions', async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: 'ready' })
      });

      // Cannot go from ready back to pending
      await expect(
        pharmacy.updateOrderStatus(TEST_REQUEST.id, 'pending')
      ).rejects.toThrow();
    });
  });
});

describe('UAT - Community Engagement', () => {
  describe('Scenario: User engages with community posts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('User can create a community post', async () => {
      addDoc.mockResolvedValueOnce({ id: 'post-new' });

      const postId = await community.createPost(
        TEST_USERS.PATIENT.uid,
        TEST_USERS.PATIENT.name,
        'Recipes',
        'Diabetes-Friendly Breakfast',
        'Here is a great recipe...'
      );

      expect(postId).toBe('post-new');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          category: 'Recipes',
          authorId: TEST_USERS.PATIENT.uid
        })
      );
    });

    test('User can add comment to post', async () => {
      addDoc.mockResolvedValueOnce({ id: 'comment-new' });
      updateDoc.mockResolvedValueOnce();

      const commentId = await community.addComment(
        TEST_POST.id,
        TEST_USERS.PATIENT.uid,
        TEST_USERS.PATIENT.name,
        'This is very helpful!'
      );

      expect(commentId).toBe('comment-new');
      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          commentCount: expect.any(Object)
        })
      );
    });

    test('User can like/mark post helpful', async () => {
      updateDoc.mockResolvedValueOnce();

      await community.markHelpful(TEST_POST.id, TEST_USERS.PATIENT.uid);

      expect(updateDoc).toHaveBeenCalled();
    });

    test('User can save post for later', async () => {
      setDoc.mockResolvedValueOnce();

      await community.savePost(TEST_USERS.PATIENT.uid, TEST_POST.id);

      expect(setDoc).toHaveBeenCalled();
    });

    test('User can report inappropriate post', async () => {
      addDoc.mockResolvedValueOnce({ id: 'report-new' });

      const reportId = await community.reportPost(
        TEST_POST.id,
        TEST_USERS.PATIENT.uid,
        'Spam content'
      );

      expect(reportId).toBe('report-new');
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          reason: 'Spam content',
          resolved: false
        })
      );
    });
  });

  describe('Scenario: User browses community categories', () => {
    test('User sees correct category labels', () => {
      expect(community.getCategoryLabel('Recipes')).toBe('Recipes');
      expect(community.getCategoryLabel('Exercise')).toBe('Exercise');
      expect(community.getCategoryLabel('Support')).toBe('Support');
      expect(community.getCategoryLabel('Ask Community')).toBe('Ask Community');
    });

    test('User sees correct category icons', () => {
      expect(community.getCategoryIcon('Recipes')).toBe('ri-restaurant-line');
      expect(community.getCategoryIcon('Exercise')).toBe('ri-run-line');
      expect(community.getCategoryIcon('Support')).toBe('ri-heart-3-line');
    });

    test('Helpful count displays correctly', () => {
      expect(community.formatHelpfulCount(0)).toBe('0');
      expect(community.formatHelpfulCount(42)).toBe('42');
      expect(community.formatHelpfulCount(1000)).toBe('1k');
      expect(community.formatHelpfulCount(1500)).toBe('1.5k');
    });
  });
});