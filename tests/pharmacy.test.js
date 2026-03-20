/**
 * pharmacy.test.js
 * Unit tests for pure pharmacy helper logic.
 */

// ── Pure helpers (mirrors logic in pharmacy.js) ───────────────────────────────

function getStatusLabel(status) {
  const labels = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    ready:     'Ready for Pickup',
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

function getNextStatus(currentStatus) {
  const next = {
    pending:   'confirmed',
    confirmed: 'ready',
    ready:     'collected'
  };
  return next[currentStatus] || null;
}

function getNextStatusLabel(currentStatus) {
  const labels = {
    pending:   'Confirm Order',
    confirmed: 'Mark as Ready',
    ready:     'Mark as Collected'
  };
  return labels[currentStatus] || null;
}

function getOrderCounts(orders) {
  return {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    collected: orders.filter(o => o.status === 'collected').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };
}

function isValidTransition(currentStatus, newStatus) {
  const validTransitions = {
    pending:   ['confirmed', 'cancelled'],
    confirmed: ['ready',     'cancelled'],
    ready:     ['collected'],
    collected: [],
    cancelled: []
  };
  return (validTransitions[currentStatus] || []).includes(newStatus);
}


// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getStatusLabel', () => {
  test('returns correct label for each status', () => {
    expect(getStatusLabel('pending')).toBe('Pending');
    expect(getStatusLabel('confirmed')).toBe('Confirmed');
    expect(getStatusLabel('ready')).toBe('Ready for Pickup');
    expect(getStatusLabel('collected')).toBe('Collected');
    expect(getStatusLabel('cancelled')).toBe('Cancelled');
  });

  test('returns Unknown for unrecognised status', () => {
    expect(getStatusLabel('other')).toBe('Unknown');
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


describe('getNextStatus', () => {
  test('pending → confirmed', () => {
    expect(getNextStatus('pending')).toBe('confirmed');
  });

  test('confirmed → ready', () => {
    expect(getNextStatus('confirmed')).toBe('ready');
  });

  test('ready → collected', () => {
    expect(getNextStatus('ready')).toBe('collected');
  });

  test('collected has no next status', () => {
    expect(getNextStatus('collected')).toBeNull();
  });

  test('cancelled has no next status', () => {
    expect(getNextStatus('cancelled')).toBeNull();
  });
});


describe('getNextStatusLabel', () => {
  test('returns correct action label for pending', () => {
    expect(getNextStatusLabel('pending')).toBe('Confirm Order');
  });

  test('returns correct action label for confirmed', () => {
    expect(getNextStatusLabel('confirmed')).toBe('Mark as Ready');
  });

  test('returns correct action label for ready', () => {
    expect(getNextStatusLabel('ready')).toBe('Mark as Collected');
  });

  test('returns null for collected', () => {
    expect(getNextStatusLabel('collected')).toBeNull();
  });
});


describe('getOrderCounts', () => {
  const orders = [
    { status: 'pending' },
    { status: 'pending' },
    { status: 'confirmed' },
    { status: 'ready' },
    { status: 'collected' },
    { status: 'cancelled' }
  ];

  test('counts total correctly', () => {
    expect(getOrderCounts(orders).total).toBe(6);
  });

  test('counts pending correctly', () => {
    expect(getOrderCounts(orders).pending).toBe(2);
  });

  test('counts confirmed correctly', () => {
    expect(getOrderCounts(orders).confirmed).toBe(1);
  });

  test('counts ready correctly', () => {
    expect(getOrderCounts(orders).ready).toBe(1);
  });

  test('counts collected correctly', () => {
    expect(getOrderCounts(orders).collected).toBe(1);
  });

  test('counts cancelled correctly', () => {
    expect(getOrderCounts(orders).cancelled).toBe(1);
  });

  test('returns zero counts for empty array', () => {
    const counts = getOrderCounts([]);
    expect(counts.total).toBe(0);
    expect(counts.pending).toBe(0);
  });
});


describe('isValidTransition', () => {
  test('pending → confirmed is valid', () => {
    expect(isValidTransition('pending', 'confirmed')).toBe(true);
  });

  test('pending → cancelled is valid', () => {
    expect(isValidTransition('pending', 'cancelled')).toBe(true);
  });

  test('pending → ready is invalid', () => {
    expect(isValidTransition('pending', 'ready')).toBe(false);
  });

  test('confirmed → ready is valid', () => {
    expect(isValidTransition('confirmed', 'ready')).toBe(true);
  });

  test('confirmed → cancelled is valid', () => {
    expect(isValidTransition('confirmed', 'cancelled')).toBe(true);
  });

  test('ready → collected is valid', () => {
    expect(isValidTransition('ready', 'collected')).toBe(true);
  });

  test('ready → cancelled is invalid', () => {
    expect(isValidTransition('ready', 'cancelled')).toBe(false);
  });

  test('collected → anything is invalid', () => {
    expect(isValidTransition('collected', 'pending')).toBe(false);
    expect(isValidTransition('collected', 'cancelled')).toBe(false);
  });

  test('cancelled → anything is invalid', () => {
    expect(isValidTransition('cancelled', 'pending')).toBe(false);
  });
});


describe('getEffectiveActionLabel', () => {
  // Mirrors the logic in order-detail.html:
  // if delivery was requested and status is ready → show "Mark as Dispatched"
  // otherwise show the normal next status label
  function getEffectiveActionLabel(status, deliveryPreference) {
    const nextLabels = {
      pending:   'Confirm Order',
      confirmed: 'Mark as Ready',
      ready:     'Mark as Collected'
    };
    if (deliveryPreference === 'delivery' && status === 'ready') {
      return 'Mark as Dispatched';
    }
    return nextLabels[status] || null;
  }

  test('shows Mark as Dispatched when delivery requested and status is ready', () => {
    expect(getEffectiveActionLabel('ready', 'delivery')).toBe('Mark as Dispatched');
  });

  test('shows Mark as Collected when pickup preferred and status is ready', () => {
    expect(getEffectiveActionLabel('ready', 'pickup')).toBe('Mark as Collected');
  });

  test('shows Mark as Collected when no delivery preference set', () => {
    expect(getEffectiveActionLabel('ready', null)).toBe('Mark as Collected');
  });

  test('shows Confirm Order for pending regardless of delivery preference', () => {
    expect(getEffectiveActionLabel('pending', 'delivery')).toBe('Confirm Order');
  });

  test('shows Mark as Ready for confirmed regardless of delivery preference', () => {
    expect(getEffectiveActionLabel('confirmed', 'delivery')).toBe('Mark as Ready');
  });

  test('returns null for collected status', () => {
    expect(getEffectiveActionLabel('collected', null)).toBeNull();
  });
});


describe('shouldShowDeliveryBadge', () => {
  function shouldShowDeliveryBadge(deliveryPreference) {
    return deliveryPreference === 'delivery';
  }

  test('shows badge when delivery is requested', () => {
    expect(shouldShowDeliveryBadge('delivery')).toBe(true);
  });

  test('hides badge when pickup is selected', () => {
    expect(shouldShowDeliveryBadge('pickup')).toBe(false);
  });

  test('hides badge when no preference set', () => {
    expect(shouldShowDeliveryBadge(null)).toBe(false);
  });

  test('hides badge when preference is undefined', () => {
    expect(shouldShowDeliveryBadge(undefined)).toBe(false);
  });
});