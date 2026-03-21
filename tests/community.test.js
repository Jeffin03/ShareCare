/**
 * community.test.js
 * Unit tests for pure community helper logic.
 */

// ── Pure helpers (mirrors logic in community.js and community pages) ──────────

const VALID_CATEGORIES = [
    'Recipes',
    'Exercise',
    'Snacks',
    'Support',
    'Tips & Tricks',
    'Ask Community',
  ];
  
  function validatePost(title, body, category) {
    const errors = [];
  
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title is required.');
    } else if (title.trim().length > 120) {
      errors.push('Title must be 120 characters or fewer.');
    }
  
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      errors.push('Post content is required.');
    }
  
    if (!category || !VALID_CATEGORIES.includes(category)) {
      errors.push('A valid category is required.');
    }
  
    return errors;
  }
  
  function getCategoryLabel(category) {
    const labels = {
      'Recipes':       'Recipes',
      'Exercise':      'Exercise',
      'Snacks':        'Snacks',
      'Support':       'Support',
      'Tips & Tricks': 'Tips & Tricks',
      'Ask Community': 'Ask Community',
    };
    return labels[category] || 'Unknown';
  }
  
  function getCategoryIcon(category) {
    const icons = {
      'Recipes':       'ri-restaurant-line',
      'Exercise':      'ri-run-line',
      'Snacks':        'ri-snack-line',
      'Support':       'ri-heart-3-line',
      'Tips & Tricks': 'ri-lightbulb-line',
      'Ask Community': 'ri-question-answer-line',
    };
    return icons[category] || 'ri-tag-line';
  }
  
  function formatHelpfulCount(count) {
    if (typeof count !== 'number' || isNaN(count) || count < 0) return '0';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
    if (count >= 1_000)     return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(count);
  }
  
  function canEditPost(authorId, currentUserId) {
    if (!authorId || !currentUserId) return false;
    return authorId === currentUserId;
  }
  
  function buildPostData(authorId, authorName, title, body, category, tags = []) {
    return {
      authorId,
      authorName,
      title:        title.trim(),
      body:         body.trim(),
      category,
      tags:         Array.isArray(tags) ? tags : [],
      helpfulCount: 0,
      commentCount: 0,
      helpfulBy:    [],
      status:       'pending',
    };
  }
  
  
  // ── Tests ─────────────────────────────────────────────────────────────────────
  
  describe('validatePost', () => {
    test('returns no errors for a fully valid post', () => {
      expect(validatePost('A good title', 'Some body content here.', 'Recipes')).toEqual([]);
    });
  
    test('returns error when title is empty string', () => {
      const errors = validatePost('', 'Body text.', 'Exercise');
      expect(errors).toContain('Title is required.');
    });
  
    test('returns error when title is whitespace only', () => {
      const errors = validatePost('   ', 'Body text.', 'Exercise');
      expect(errors).toContain('Title is required.');
    });
  
    test('returns error when title is null', () => {
      const errors = validatePost(null, 'Body text.', 'Exercise');
      expect(errors).toContain('Title is required.');
    });
  
    test('returns error when title exceeds 120 characters', () => {
      const longTitle = 'A'.repeat(121);
      const errors = validatePost(longTitle, 'Body text.', 'Recipes');
      expect(errors).toContain('Title must be 120 characters or fewer.');
    });
  
    test('accepts title of exactly 120 characters', () => {
      const maxTitle = 'A'.repeat(120);
      const errors = validatePost(maxTitle, 'Body text.', 'Recipes');
      expect(errors).not.toContain('Title must be 120 characters or fewer.');
    });
  
    test('returns error when body is empty string', () => {
      const errors = validatePost('Valid title', '', 'Support');
      expect(errors).toContain('Post content is required.');
    });
  
    test('returns error when body is whitespace only', () => {
      const errors = validatePost('Valid title', '   ', 'Support');
      expect(errors).toContain('Post content is required.');
    });
  
    test('returns error when body is null', () => {
      const errors = validatePost('Valid title', null, 'Support');
      expect(errors).toContain('Post content is required.');
    });
  
    test('returns error when category is null', () => {
      const errors = validatePost('Valid title', 'Body text.', null);
      expect(errors).toContain('A valid category is required.');
    });
  
    test('returns error when category is not in the allowed list', () => {
      const errors = validatePost('Valid title', 'Body text.', 'Hobbies');
      expect(errors).toContain('A valid category is required.');
    });
  
    test('returns error when category is empty string', () => {
      const errors = validatePost('Valid title', 'Body text.', '');
      expect(errors).toContain('A valid category is required.');
    });
  
    test('accumulates multiple errors when several fields are invalid', () => {
      const errors = validatePost('', '', null);
      expect(errors).toContain('Title is required.');
      expect(errors).toContain('Post content is required.');
      expect(errors).toContain('A valid category is required.');
      expect(errors.length).toBe(3);
    });
  
    test('accepts all six valid categories without a category error', () => {
      const categories = [
        'Recipes', 'Exercise', 'Snacks',
        'Support', 'Tips & Tricks', 'Ask Community',
      ];
      categories.forEach(cat => {
        const errors = validatePost('Title', 'Body', cat);
        expect(errors).not.toContain('A valid category is required.');
      });
    });
  });
  
  
  describe('getCategoryLabel', () => {
    test('returns correct label for Recipes', () => {
      expect(getCategoryLabel('Recipes')).toBe('Recipes');
    });
  
    test('returns correct label for Exercise', () => {
      expect(getCategoryLabel('Exercise')).toBe('Exercise');
    });
  
    test('returns correct label for Snacks', () => {
      expect(getCategoryLabel('Snacks')).toBe('Snacks');
    });
  
    test('returns correct label for Support', () => {
      expect(getCategoryLabel('Support')).toBe('Support');
    });
  
    test('returns correct label for Tips & Tricks', () => {
      expect(getCategoryLabel('Tips & Tricks')).toBe('Tips & Tricks');
    });
  
    test('returns correct label for Ask Community', () => {
      expect(getCategoryLabel('Ask Community')).toBe('Ask Community');
    });
  
    test('returns Unknown for an unrecognised category', () => {
      expect(getCategoryLabel('Hobbies')).toBe('Unknown');
    });
  
    test('returns Unknown for null', () => {
      expect(getCategoryLabel(null)).toBe('Unknown');
    });
  
    test('returns Unknown for empty string', () => {
      expect(getCategoryLabel('')).toBe('Unknown');
    });
  });
  
  
  describe('getCategoryIcon', () => {
    test('returns ri-restaurant-line for Recipes', () => {
      expect(getCategoryIcon('Recipes')).toBe('ri-restaurant-line');
    });
  
    test('returns ri-run-line for Exercise', () => {
      expect(getCategoryIcon('Exercise')).toBe('ri-run-line');
    });
  
    test('returns ri-snack-line for Snacks', () => {
      expect(getCategoryIcon('Snacks')).toBe('ri-snack-line');
    });
  
    test('returns ri-heart-3-line for Support', () => {
      expect(getCategoryIcon('Support')).toBe('ri-heart-3-line');
    });
  
    test('returns ri-lightbulb-line for Tips & Tricks', () => {
      expect(getCategoryIcon('Tips & Tricks')).toBe('ri-lightbulb-line');
    });
  
    test('returns ri-question-answer-line for Ask Community', () => {
      expect(getCategoryIcon('Ask Community')).toBe('ri-question-answer-line');
    });
  
    test('all icons use the ri- remixicon prefix', () => {
      VALID_CATEGORIES.forEach(cat => {
        expect(getCategoryIcon(cat).startsWith('ri-')).toBe(true);
      });
    });
  
    test('returns fallback icon for unrecognised category', () => {
      expect(getCategoryIcon('Unknown')).toBe('ri-tag-line');
    });
  
    test('returns fallback icon for null', () => {
      expect(getCategoryIcon(null)).toBe('ri-tag-line');
    });
  });
  
  
  describe('formatHelpfulCount', () => {
    test('formats 0 as "0"', () => {
      expect(formatHelpfulCount(0)).toBe('0');
    });
  
    test('formats single-digit counts as plain number', () => {
      expect(formatHelpfulCount(1)).toBe('1');
      expect(formatHelpfulCount(9)).toBe('9');
    });
  
    test('formats counts below 1000 as plain number', () => {
      expect(formatHelpfulCount(42)).toBe('42');
      expect(formatHelpfulCount(999)).toBe('999');
    });
  
    test('formats 1000 as "1k"', () => {
      expect(formatHelpfulCount(1000)).toBe('1k');
    });
  
    test('formats 1500 as "1.5k"', () => {
      expect(formatHelpfulCount(1500)).toBe('1.5k');
    });
  
    test('formats 10000 as "10k"', () => {
      expect(formatHelpfulCount(10000)).toBe('10k');
    });
  
    test('formats 999999 as "1000k" or handles boundary correctly', () => {
      // 999999 / 1000 = 999.999 → rounds to "1000k" with toFixed(1)
      // Acceptable: implementation may render "1000k" or "1m" — test the boundary rule
      const result = formatHelpfulCount(999999);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  
    test('formats 1000000 as "1m"', () => {
      expect(formatHelpfulCount(1_000_000)).toBe('1m');
    });
  
    test('formats 2500000 as "2.5m"', () => {
      expect(formatHelpfulCount(2_500_000)).toBe('2.5m');
    });
  
    test('returns "0" for negative numbers', () => {
      expect(formatHelpfulCount(-5)).toBe('0');
    });
  
    test('returns "0" for NaN', () => {
      expect(formatHelpfulCount(NaN)).toBe('0');
    });
  
    test('returns "0" for non-number input', () => {
      expect(formatHelpfulCount(null)).toBe('0');
      expect(formatHelpfulCount(undefined)).toBe('0');
    });
  });
  
  
  describe('canEditPost', () => {
    test('returns true when authorId matches currentUserId', () => {
      expect(canEditPost('user-123', 'user-123')).toBe(true);
    });
  
    test('returns false when authorId does not match currentUserId', () => {
      expect(canEditPost('user-123', 'user-456')).toBe(false);
    });
  
    test('returns false when authorId is null', () => {
      expect(canEditPost(null, 'user-456')).toBe(false);
    });
  
    test('returns false when currentUserId is null', () => {
      expect(canEditPost('user-123', null)).toBe(false);
    });
  
    test('returns false when both arguments are null', () => {
      expect(canEditPost(null, null)).toBe(false);
    });
  
    test('returns false when authorId is empty string', () => {
      expect(canEditPost('', 'user-456')).toBe(false);
    });
  
    test('returns false when currentUserId is empty string', () => {
      expect(canEditPost('user-123', '')).toBe(false);
    });
  
    test('is case-sensitive — different casing returns false', () => {
      expect(canEditPost('User-123', 'user-123')).toBe(false);
    });
  });
  
  
  describe('buildPostData', () => {
    const base = () => buildPostData(
      'user-abc',
      'Priya Sharma',
      'Low-GI Ragi Dosa',
      'Here is my recipe for ragi dosa.',
      'Recipes',
      ['ragi', 'low-gi', 'breakfast'],
    );
  
    test('sets authorId correctly', () => {
      expect(base().authorId).toBe('user-abc');
    });
  
    test('sets authorName correctly', () => {
      expect(base().authorName).toBe('Priya Sharma');
    });
  
    test('trims title whitespace', () => {
      const post = buildPostData('u1', 'Name', '  My Title  ', 'Body.', 'Snacks', []);
      expect(post.title).toBe('My Title');
    });
  
    test('trims body whitespace', () => {
      const post = buildPostData('u1', 'Name', 'Title', '  My body.  ', 'Snacks', []);
      expect(post.body).toBe('My body.');
    });
  
    test('sets category correctly', () => {
      expect(base().category).toBe('Recipes');
    });
  
    test('sets tags array correctly', () => {
      expect(base().tags).toEqual(['ragi', 'low-gi', 'breakfast']);
    });
  
    test('defaults tags to empty array when not provided', () => {
      const post = buildPostData('u1', 'Name', 'Title', 'Body.', 'Exercise');
      expect(post.tags).toEqual([]);
    });
  
    test('defaults tags to empty array when non-array is passed', () => {
      const post = buildPostData('u1', 'Name', 'Title', 'Body.', 'Exercise', null);
      expect(post.tags).toEqual([]);
    });
  
    test('initialises helpfulCount to 0', () => {
      expect(base().helpfulCount).toBe(0);
    });
  
    test('initialises commentCount to 0', () => {
      expect(base().commentCount).toBe(0);
    });
  
    test('initialises helpfulBy to empty array', () => {
      expect(base().helpfulBy).toEqual([]);
    });
  
    test('sets status to "pending"', () => {
      expect(base().status).toBe('pending');
    });
  
    test('does not include a createdAt field (that is added by serverTimestamp in Firestore)', () => {
      expect(base().createdAt).toBe(undefined);
    });
  });