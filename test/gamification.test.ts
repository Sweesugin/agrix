import { test } from 'node:test';
import assert from 'node:assert';
import { db, calculateLevel } from '../server/db/store';

test('Gamification - Level Progression Thresholds', () => {
  assert.strictEqual(calculateLevel(50).level, 1);
  assert.strictEqual(calculateLevel(50).levelTitle, 'Seedling');

  assert.strictEqual(calculateLevel(250).level, 2);
  assert.strictEqual(calculateLevel(250).levelTitle, 'Grower');

  assert.strictEqual(calculateLevel(600).level, 3);
  assert.strictEqual(calculateLevel(600).levelTitle, 'Cultivator');

  assert.strictEqual(calculateLevel(1000).level, 4);
  assert.strictEqual(calculateLevel(1000).levelTitle, 'Sustainable Farmer');

  assert.strictEqual(calculateLevel(1500).level, 5);
  assert.strictEqual(calculateLevel(1500).levelTitle, 'Green Champion');
});

test('Gamification - Reward Ledger Deduplication', () => {
  const testUserId = `test_farmer_${Date.now()}`;
  const testChallengeId = 'chal_test_dedup';

  // First award
  const res1 = db.recordRewardTransaction(
    testUserId,
    testChallengeId,
    50,
    'First time completion'
  );
  assert.strictEqual(res1.isDuplicate, false);
  assert.strictEqual(res1.transaction.pointsAwarded, 50);

  // Second award on identical user + challenge
  const res2 = db.recordRewardTransaction(
    testUserId,
    testChallengeId,
    50,
    'Attempted duplicate completion'
  );
  assert.strictEqual(res2.isDuplicate, true);
  assert.strictEqual(res2.transaction.id, res1.transaction.id);
});

test('Gamification - Monthly Points Calculation', () => {
  const testUserId = `monthly_farmer_${Date.now()}`;
  
  // Award a transaction dated today
  db.recordRewardTransaction(
    testUserId,
    'chal_monthly_1',
    75,
    'Current month verified challenge'
  );

  const monthlyPoints = db.getMonthlyPointsForUser(testUserId);
  assert.strictEqual(monthlyPoints, 75);
});
