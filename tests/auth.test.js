/**
 * auth.test.js
 * Unit tests for pure auth helper logic.
 * No Firebase connection needed — tests the logic functions directly.
 */

// ── Pure helper functions (mirrors the logic in auth.js) ─────────────────────

function getRedirectTarget(role, intendedPath) {
  if (intendedPath) return intendedPath;
  return role === 'pharmacy' ? '/pharmacy/dashboard.html' : '/patient/dashboard.html';
}

function validateSignUpInput(name, email, password, role) {
  const errors = [];
  if (!name || name.trim().length < 2)      errors.push('Name is required.');
  if (!email || !email.includes('@'))        errors.push('Valid email is required.');
  if (!password || password.length < 8)      errors.push('Password must be at least 8 characters.');
  if (!['patient', 'pharmacy', 'caregiver'].includes(role)) errors.push('Invalid role.');
  return errors;
}

function mapFirebaseAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 8 characters.',
    'auth/user-not-found':       'Invalid email or password. Please try again.',
    'auth/wrong-password':       'Invalid email or password. Please try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function buildUserData(name, email, role) {
  return { name, email, role, createdAt: 'MOCK_TIMESTAMP' };
}

function getStatusLabel(status) {
  const labels = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    ready:     'Ready for pickup',
    collected: 'Collected',
    cancelled: 'Cancelled',
  };
  return labels[status] || 'Unknown';
}


// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getRedirectTarget', () => {
  test('redirects patient to patient dashboard by default', () => {
    expect(getRedirectTarget('patient', null)).toBe('/patient/dashboard.html');
  });

  test('redirects pharmacy to pharmacy dashboard by default', () => {
    expect(getRedirectTarget('pharmacy', null)).toBe('/pharmacy/dashboard.html');
  });

  test('uses intended path over role default for patient', () => {
    expect(getRedirectTarget('patient', '/patient/new-request.html'))
      .toBe('/patient/new-request.html');
  });

  test('uses intended path over role default for pharmacy', () => {
    expect(getRedirectTarget('pharmacy', '/pharmacy/order-detail.html'))
      .toBe('/pharmacy/order-detail.html');
  });
});


describe('validateSignUpInput', () => {
  test('passes with valid patient inputs', () => {
    const errors = validateSignUpInput('Ravi Kumar', 'ravi@example.com', 'password123', 'patient');
    expect(errors).toHaveLength(0);
  });

  test('passes with valid pharmacy inputs', () => {
    const errors = validateSignUpInput('Apollo Pharmacy', 'apollo@example.com', 'securepass', 'pharmacy');
    expect(errors).toHaveLength(0);
  });

  test('fails with empty name', () => {
    const errors = validateSignUpInput('', 'ravi@example.com', 'password123', 'patient');
    expect(errors).toContain('Name is required.');
  });

  test('fails with single character name', () => {
    const errors = validateSignUpInput('R', 'ravi@example.com', 'password123', 'patient');
    expect(errors).toContain('Name is required.');
  });

  test('fails with invalid email', () => {
    const errors = validateSignUpInput('Ravi Kumar', 'not-an-email', 'password123', 'patient');
    expect(errors).toContain('Valid email is required.');
  });

  test('fails with short password', () => {
    const errors = validateSignUpInput('Ravi Kumar', 'ravi@example.com', '123', 'patient');
    expect(errors).toContain('Password must be at least 8 characters.');
  });

  test('fails with invalid role', () => {
    const errors = validateSignUpInput('Ravi Kumar', 'ravi@example.com', 'password123', 'admin');
    expect(errors).toContain('Invalid role.');
  });

  test('returns multiple errors at once', () => {
    const errors = validateSignUpInput('', 'bad', '123', 'admin');
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});


describe('mapFirebaseAuthError', () => {
  test('maps email-already-in-use correctly', () => {
    expect(mapFirebaseAuthError('auth/email-already-in-use'))
      .toBe('An account with this email already exists.');
  });

  test('maps wrong-password to generic message', () => {
    expect(mapFirebaseAuthError('auth/wrong-password'))
      .toBe('Invalid email or password. Please try again.');
  });

  test('maps user-not-found to same message as wrong-password', () => {
    expect(mapFirebaseAuthError('auth/user-not-found'))
      .toBe('Invalid email or password. Please try again.');
  });

  test('maps weak-password correctly', () => {
    expect(mapFirebaseAuthError('auth/weak-password'))
      .toBe('Password must be at least 8 characters.');
  });

  test('returns fallback for unknown error codes', () => {
    expect(mapFirebaseAuthError('auth/unknown-error'))
      .toBe('Something went wrong. Please try again.');
  });
});


describe('buildUserData', () => {
  test('builds correct user object for patient', () => {
    const data = buildUserData('Ravi Kumar', 'ravi@example.com', 'patient');
    expect(data.name).toBe('Ravi Kumar');
    expect(data.email).toBe('ravi@example.com');
    expect(data.role).toBe('patient');
  });

  test('builds correct user object for pharmacy', () => {
    const data = buildUserData('Apollo Pharmacy', 'apollo@example.com', 'pharmacy');
    expect(data.role).toBe('pharmacy');
  });
});


describe('getStatusLabel', () => {
  test('returns correct label for pending', () => {
    expect(getStatusLabel('pending')).toBe('Pending');
  });

  test('returns correct label for ready', () => {
    expect(getStatusLabel('ready')).toBe('Ready for pickup');
  });

  test('returns correct label for collected', () => {
    expect(getStatusLabel('collected')).toBe('Collected');
  });

  test('returns Unknown for unrecognised status', () => {
    expect(getStatusLabel('something_random')).toBe('Unknown');
  });
});