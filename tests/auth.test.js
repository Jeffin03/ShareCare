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


describe('validateEmail', () => {
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  test('accepts valid email', () => {
    expect(validateEmail('ravi@example.com')).toBe(true);
  });

  test('accepts email with subdomain', () => {
    expect(validateEmail('ravi@mail.example.com')).toBe(true);
  });

  test('rejects email without @', () => {
    expect(validateEmail('raviexample.com')).toBe(false);
  });

  test('rejects email without domain', () => {
    expect(validateEmail('ravi@')).toBe(false);
  });

  test('rejects email with spaces', () => {
    expect(validateEmail('ravi @example.com')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});


describe('validatePassword', () => {
  function validatePassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) return 'Password must contain at least one letter and one number.';
    return null;
  }

  test('accepts valid password with letters and numbers', () => {
    expect(validatePassword('password123')).toBeNull();
  });

  test('accepts mixed case with numbers', () => {
    expect(validatePassword('MyPass99')).toBeNull();
  });

  test('rejects password shorter than 8 chars', () => {
    expect(validatePassword('pass1')).toBe('Password must be at least 8 characters.');
  });

  test('rejects password with only letters', () => {
    expect(validatePassword('passwordonly')).toBe('Password must contain at least one letter and one number.');
  });

  test('rejects password with only numbers', () => {
    expect(validatePassword('12345678')).toBe('Password must contain at least one letter and one number.');
  });
});


describe('validateName', () => {
  function validateName(name) {
    return /^[a-zA-Z\s'-]{2,50}$/.test(name);
  }

  test('accepts simple name', () => {
    expect(validateName('Ravi')).toBe(true);
  });

  test('accepts name with hyphen', () => {
    expect(validateName('Mary-Jane')).toBe(true);
  });

  test('accepts name with apostrophe', () => {
    expect(validateName("O'Brien")).toBe(true);
  });

  test('rejects single character name', () => {
    expect(validateName('R')).toBe(false);
  });

  test('rejects name with numbers', () => {
    expect(validateName('Ravi123')).toBe(false);
  });

  test('rejects name with special characters', () => {
    expect(validateName('Ravi@Kumar')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateName('')).toBe(false);
  });
});


describe('validatePhone', () => {
  function validatePhone(phone) {
    return /^[0-9\s\-\+\(\)]{7,15}$/.test(phone);
  }

  test('accepts standard phone number', () => {
    expect(validatePhone('9876543210')).toBe(true);
  });

  test('accepts phone with dashes', () => {
    expect(validatePhone('080-41234567')).toBe(true);
  });

  test('accepts phone with country code', () => {
    expect(validatePhone('+91 9876543210')).toBe(true);
  });

  test('rejects phone with letters', () => {
    expect(validatePhone('9876abc210')).toBe(false);
  });

  test('rejects phone too short', () => {
    expect(validatePhone('123')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validatePhone('')).toBe(false);
  });
});