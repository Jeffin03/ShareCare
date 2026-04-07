// ──────────────────────────────────────────────────────────────────────────────
// E2E (End-to-End Tests): Complete user journeys
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

describe('E2E - Complete Patient Journey', () => {
  test('Patient: Registration → Request Medicine → Track Status → Cancel Request', async () => {
    // 1. Patient registers
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'patient-e2e-001' }
    });
    setDoc.mockResolvedValueOnce();

    const newPatient = await auth.signUp(
      'Emma Patient',
      'emma@example.com',
      'Password123!',
      'patient'
    );
    expect(newPatient.uid).toBe('patient-e2e-001');

    // 2. Patient logs in
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'patient-e2e-001' }
    });
    const loggedInUser = await auth.logIn('emma@example.com', 'Password123!');
    expect(loggedInUser.uid).toBe('patient-e2e-001');

    // 3. Patient views available pharmacies
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'pharm-e2e',
          data: () => ({ name: 'E2E Pharmacy', city: 'NYC' })
        }
      ]
    });
    const pharmacies = await patient.getPharmacies();
    expect(pharmacies).toHaveLength(1);

    // 4. Patient submits medicine request
    addDoc.mockResolvedValueOnce({ id: 'req-e2e-001' });

    const medicines = [
      { name: 'Insulin', quantity: 1 },
      { name: 'Metformin', quantity: 2 }
    ];

    const requestId = await patient.submitRequest(
      'patient-e2e-001',
      'Emma Patient',
      'pharm-e2e',
      'E2E Pharmacy',
      medicines,
      'Urgent',
      '3:00 PM'
    );
    expect(requestId).toBe('req-e2e-001');

    // 5. Patient tracks request status progression
    const statuses = ['pending', 'confirmed', 'ready', 'collected'];

    for (let i = 0; i < statuses.length; i++) {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          ...TEST_REQUEST,
          id: requestId,
          status: statuses[i]
        })
      });

      const request = await patient.getRequest(requestId);
      expect(request.status).toBe(statuses[i]);
      expect(patient.getStatusLabel(request.status)).toBeDefined();
    }

    // 6. Patient attempts to cancel (should fail as it's now collected)
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...TEST_REQUEST,
        id: requestId,
        status: 'collected'
      })
    });

    await expect(
      patient.cancelRequest(requestId)
    ).rejects.toThrow('Only pending requests can be cancelled');
  });

  test('Patient: Multiple Requests → View All → Filter by Status', async () => {
    const patientId = 'patient-multi-001';

    // Submit multiple requests
    const requestIds = [];
    for (let i = 0; i < 3; i++) {
      addDoc.mockResolvedValueOnce({ id: `req-multi-${i}` });
      const id = await patient.submitRequest(
        patientId,
        'Multi Patient',
        'pharm-1',
        'Pharmacy 1',
        [{ name: 'Medicine', quantity: 1 }],
        'Note',
        '2:00 PM'
      );
      requestIds.push(id);
    }

    expect(requestIds).toHaveLength(3);

    // Fetch all requests
    getDocs.mockResolvedValueOnce({
      docs: requestIds.map((id, i) => ({
        id,
        data: () => ({
          ...TEST_REQUEST,
          id,
          status: ['pending', 'confirmed', 'ready'][i]
        })
      }))
    });

    const allRequests = await patient.getPatientRequests(patientId);
    expect(allRequests).toHaveLength(3);

    // Verify different statuses
    const pendingRequests = allRequests.filter(r => r.status === 'pending');
    expect(pendingRequests).toHaveLength(1);
  });

  test('Patient: Subscribe to Real-time Updates', (done) => {
    const requestId = 'req-realtime-001';
    let updateCount = 0;

    const unsubscribe = patient.listenToRequest(requestId, (request) => {
      updateCount++;
      expect(request.id).toBe(requestId);

      if (updateCount === 3) {
        unsubscribe();
        done();
      }
    });
  });
});

describe('E2E - Complete Pharmacy Journey', () => {
  test('Pharmacy: Login → View Orders → Process Workflow', async () => {
    const pharmacyId = 'pharm-e2e-001';

    // 1. Pharmacy logs in
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: pharmacyId }
    });
    const pharmacyUser = await auth.logIn('pharmacy@example.com', 'password123');
    expect(pharmacyUser.uid).toBe(pharmacyId);

    // 2. Pharmacy views pending orders
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'order-e2e-1',
          data: () => ({ ...TEST_REQUEST, status: 'pending' })
        },
        {
          id: 'order-e2e-2',
          data: () => ({ ...TEST_REQUEST, status: 'pending' })
        }
      ]
    });

    const orders = await pharmacy.getPharmacyOrders(pharmacyId);
    expect(orders).toHaveLength(2);

    // 3. Pharmacy processes first order through complete workflow
    const orderId = 'order-e2e-1';

    // Confirm order
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...TEST_REQUEST, status: 'pending' })
    });
    updateDoc.mockResolvedValueOnce();

    await pharmacy.updateOrderStatus(orderId, 'confirmed', 'Medicines in stock');
    expect(updateDoc).toHaveBeenCalled();

    // Mark as ready
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...TEST_REQUEST, status: 'confirmed' })
    });
    updateDoc.mockResolvedValueOnce();

    await pharmacy.updateOrderStatus(orderId, 'ready');
    expect(updateDoc).toHaveBeenCalled();

    // Mark as collected
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...TEST_REQUEST, status: 'ready' })
    });
    updateDoc.mockResolvedValueOnce();

    await pharmacy.updateOrderStatus(orderId, 'collected');
    expect(updateDoc).toHaveBeenCalled();
  });

  test('Pharmacy: Handle Invalid Order Transitions', async () => {
    const invalidTransitions = [
      { from: 'pending', to: 'collected' },    // Skip steps
      { from: 'confirmed', to: 'pending' },    // Go backwards
      { from: 'collected', to: 'ready' }       // Already done
    ];

    for (const transition of invalidTransitions) {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...TEST_REQUEST, status: transition.from })
      });

      await expect(
        pharmacy.updateOrderStatus('order-invalid', transition.to)
      ).rejects.toThrow();
    }
  });

  test('Pharmacy: Real-time Order Listener', (done) => {
    const pharmacyId = 'pharm-realtime-001';
    let updateCount = 0;

    const unsubscribe = pharmacy.listenToPharmacyOrders(
      pharmacyId,
      (orders) => {
        updateCount++;
        expect(Array.isArray(orders)).toBe(true);

        if (updateCount === 2) {
          unsubscribe();
          done();
        }
      }
    );
  });
});

describe('E2E - Complete Community Journey', () => {
  test('Community: Create Post → Comment → Like → Save', async () => {
    const userId = 'user-community-e2e';
    const userName = 'Community User';

    // 1. User creates post
    addDoc.mockResolvedValueOnce({ id: 'post-e2e-001' });

    const postId = await community.createPost(
      userId,
      userName,
      'Tips & Tricks',
      'Managing Blood Sugar at Work',
      'Here are some tips for managing...'
    );
    expect(postId).toBe('post-e2e-001');

    // 2. Other user comments
    addDoc.mockResolvedValueOnce({ id: 'comment-e2e-001' });
    updateDoc.mockResolvedValueOnce();

    const commentId = await community.addComment(
      postId,
      'user-comment-001',
      'Commenter',
      'Great tips!'
    );
    expect(commentId).toBe('comment-e2e-001');

    // 3. User marks helpful
    updateDoc.mockResolvedValueOnce();
    await community.markHelpful(postId, 'user-voter-001');
    expect(updateDoc).toHaveBeenCalled();

    // 4. User saves for later
    setDoc.mockResolvedValueOnce();
    await community.savePost(userId, postId);
    expect(setDoc).toHaveBeenCalled();

    // 5. Verify post retrieval shows all engagement
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...TEST_POST,
        id: postId,
        helpfulCount: 1,
        commentCount: 1
      })
    });

    const retrievedPost = await community.getPost(postId);
    expect(retrievedPost.helpfulCount).toBe(1);
    expect(retrievedPost.commentCount).toBe(1);
  });

  test('Community: Browse All Categories', async () => {
    const categories = ['Recipes', 'Exercise', 'Snacks', 'Support', 'Tips & Tricks', 'Ask Community'];

    categories.forEach(category => {
      const label = community.getCategoryLabel(category);
      const icon = community.getCategoryIcon(category);

      expect(label).toBe(category);
      expect(icon).toMatch(/^ri-/);
    });
  });

  test('Community: Report Inappropriate Content', async () => {
    const postId = 'post-report-e2e';
    const reporterId = 'user-report-e2e';

    addDoc.mockResolvedValueOnce({ id: 'report-e2e-001' });

    const reportId = await community.reportPost(
      postId,
      reporterId,
      'Contains offensive language'
    );

    expect(reportId).toBe('report-e2e-001');
    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        postId: postId,
        reportedBy: reporterId,
        reason: 'Contains offensive language',
        resolved: false
      })
    );
  });
});

describe('E2E - Cross-Role Scenarios', () => {
  test('Patient and Pharmacy Interaction: Full Lifecycle', async () => {
    // Patient submits request
    addDoc.mockResolvedValueOnce({ id: 'cross-req-001' });

    const patientRequestId = await patient.submitRequest(
      'patient-cross-001',
      'Cross Patient',
      'pharm-cross-001',
      'Cross Pharmacy',
      [{ name: 'Medicine', quantity: 1 }],
      'Needed ASAP',
      '5:00 PM'
    );

    // Pharmacy retrieves same request
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...TEST_REQUEST,
        id: patientRequestId
      })
    });

    const order = await pharmacy.getOrder(patientRequestId);
    expect(order.id).toBe(patientRequestId);
    expect(order.patientName).toBe('Cross Patient');

    // Pharmacy updates status
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...order, status: 'pending' })
    });
    updateDoc.mockResolvedValueOnce();

    await pharmacy.updateOrderStatus(patientRequestId, 'confirmed');

    // Patient sees update
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...TEST_REQUEST,
        id: patientRequestId,
        status: 'confirmed'
      })
    });

    const updatedRequest = await patient.getRequest(patientRequestId);
    expect(updatedRequest.status).toBe('confirmed');
    expect(patient.getStatusLabel(updatedRequest.status)).toBe('Confirmed');
  });
});

describe('E2E - Data Consistency Checks', () => {
  test('Request data consistency across patient and pharmacy views', async () => {
    const requestId = 'consistency-req-001';
    const requestData = {
      ...TEST_REQUEST,
      id: requestId,
      medicines: [
        { name: 'Vitamin D', quantity: 1 },
        { name: 'Calcium', quantity: 2 }
      ]
    };

    // Patient views request
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => requestData
    });

    const patientView = await patient.getRequest(requestId);

    // Pharmacy views same request
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => requestData
    });

    const pharmacyView = await pharmacy.getOrder(requestId);

    // Both should see identical data
    expect(patientView).toEqual(pharmacyView);
    expect(patientView.medicines).toHaveLength(2);
    expect(pharmacyView.medicines[0].name).toBe('Vitamin D');
  });

  test('Timestamp consistency across operations', async () => {
    const requestId = 'timestamp-req-001';

    // Submit request
    addDoc.mockResolvedValueOnce({ id: requestId });

    const newRequestId = await patient.submitRequest(
      'patient-ts',
      'TS Patient',
      'pharm-ts',
      'TS Pharmacy',
      [{ name: 'Med', quantity: 1 }],
      'Test',
      '2:00 PM'
    );

    // Verify timestamps exist
    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      })
    );
  });
});