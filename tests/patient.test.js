/**
 * patient.test.js
 * Unit tests for pure patient helper logic.
 */

// ── Pure helpers (mirrors logic in patient.js) ────────────────────────────────

function getStatusLabel(status) {
  const labels = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    ready:     'Ready for pickup',
    collected: 'Collected',
    cancelled: 'Cancelled'
  };
  return labels[status] || 'Unknown';
}

function getStatusClass(status) {
  const classes = {
    pending:   'status-pending',
    confirmed: 'status-confirmed',
    ready:     'status-ready',
    collected: 'status-collected',
    cancelled: 'badge-danger'
  };
  return classes[status] || 'badge-gray';
}

function validateMedicines(medicines) {
  const errors = [];
  if (!medicines || medicines.length === 0) {
    errors.push('Add at least one medicine.');
    return errors;
  }
  medicines.forEach((m, i) => {
    if (!m.name || m.name.trim().length === 0) errors.push(`Medicine ${i + 1}: name is required.`);
    if (!m.quantity || m.quantity < 1)          errors.push(`Medicine ${i + 1}: quantity must be at least 1.`);
  });
  return errors;
}

function canCancel(status) {
  return status === 'pending';
}

function buildRequestData(patientId, pharmacyId, medicines, notes, preferredPickupTime) {
  return {
    patientId,
    pharmacyId,
    medicines,
    notes,
    preferredPickupTime,
    status: 'pending'
  };
}


// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  test('returns correct label for each status', () => {
    expect(getStatusLabel('pending')).toBe('Pending');
    expect(getStatusLabel('confirmed')).toBe('Confirmed');
    expect(getStatusLabel('ready')).toBe('Ready for pickup');
    expect(getStatusLabel('collected')).toBe('Collected');
    expect(getStatusLabel('cancelled')).toBe('Cancelled');
  });

  test('returns Unknown for unrecognised status', () => {
    expect(getStatusLabel('something')).toBe('Unknown');
  });
});


describe('getStatusClass', () => {
  test('returns correct CSS class for each status', () => {
    expect(getStatusClass('pending')).toBe('status-pending');
    expect(getStatusClass('confirmed')).toBe('status-confirmed');
    expect(getStatusClass('ready')).toBe('status-ready');
    expect(getStatusClass('collected')).toBe('status-collected');
    expect(getStatusClass('cancelled')).toBe('badge-danger');
  });

  test('returns badge-gray for unknown status', () => {
    expect(getStatusClass('unknown')).toBe('badge-gray');
  });
});


describe('validateMedicines', () => {
  test('passes with valid medicines array', () => {
    const errors = validateMedicines([{ name: 'Metformin', quantity: 2 }]);
    expect(errors).toHaveLength(0);
  });

  test('passes with multiple valid medicines', () => {
    const errors = validateMedicines([
      { name: 'Metformin', quantity: 2 },
      { name: 'Glipizide', quantity: 1 }
    ]);
    expect(errors).toHaveLength(0);
  });

  test('fails with empty array', () => {
    const errors = validateMedicines([]);
    expect(errors).toContain('Add at least one medicine.');
  });

  test('fails with null', () => {
    const errors = validateMedicines(null);
    expect(errors).toContain('Add at least one medicine.');
  });

  test('fails when medicine name is empty', () => {
    const errors = validateMedicines([{ name: '', quantity: 1 }]);
    expect(errors).toContain('Medicine 1: name is required.');
  });

  test('fails when quantity is zero', () => {
    const errors = validateMedicines([{ name: 'Metformin', quantity: 0 }]);
    expect(errors).toContain('Medicine 1: quantity must be at least 1.');
  });

  test('fails when quantity is negative', () => {
    const errors = validateMedicines([{ name: 'Metformin', quantity: -1 }]);
    expect(errors).toContain('Medicine 1: quantity must be at least 1.');
  });

  test('returns errors for specific failing medicine in a list', () => {
    const errors = validateMedicines([
      { name: 'Metformin', quantity: 1 },
      { name: '', quantity: 1 }
    ]);
    expect(errors).toContain('Medicine 2: name is required.');
  });
});


describe('canCancel', () => {
  test('allows cancel when status is pending', () => {
    expect(canCancel('pending')).toBe(true);
  });

  test('blocks cancel when status is confirmed', () => {
    expect(canCancel('confirmed')).toBe(false);
  });

  test('blocks cancel when status is ready', () => {
    expect(canCancel('ready')).toBe(false);
  });

  test('blocks cancel when status is collected', () => {
    expect(canCancel('collected')).toBe(false);
  });
});


describe('buildRequestData', () => {
  test('builds request with correct default status', () => {
    const data = buildRequestData('uid1', 'pharm1', [{ name: 'Metformin', quantity: 1 }], '', 'Morning');
    expect(data.status).toBe('pending');
    expect(data.patientId).toBe('uid1');
    expect(data.pharmacyId).toBe('pharm1');
    expect(data.preferredPickupTime).toBe('Morning');
  });

  test('includes medicines array in request', () => {
    const meds = [{ name: 'Metformin', quantity: 2 }, { name: 'Glipizide', quantity: 1 }];
    const data = buildRequestData('uid1', 'pharm1', meds, 'urgent', 'Evening');
    expect(data.medicines).toHaveLength(2);
    expect(data.medicines[0].name).toBe('Metformin');
  });
});