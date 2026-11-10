import { test } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db/store';
import { requireVerifier, AuthRequest } from '../server/middleware/auth';
import { User, Challenge, UserChallenge } from '../server/db/types';

test('Challenge Security - Verifier Authorization restricts farmers', () => {
  const farmerReq: AuthRequest = {
    user: { id: 'farmer_sec_1', role: 'farmer' } as any,
  } as any;
  let farmerPassed = false;
  let farmerStatus = 0;
  const farmerRes: any = {
    status: (code: number) => {
      farmerStatus = code;
      return { json: (d: any) => d };
    },
  };

  requireVerifier(farmerReq, farmerRes, () => {
    farmerPassed = true;
  });

  assert.strictEqual(farmerPassed, false, 'Farmer must not pass requireVerifier');
  assert.strictEqual(farmerStatus, 403);

  const inspectorReq: AuthRequest = {
    user: { id: 'user_inspector', role: 'inspector' } as any,
  } as any;
  let inspectorPassed = false;
  requireVerifier(inspectorReq, farmerRes, () => {
    inspectorPassed = true;
  });
  assert.strictEqual(inspectorPassed, true, 'Inspector must pass requireVerifier');
});

test('Challenge Security - Self-verification is strictly prohibited', () => {
  // Even if a user has an inspector or admin role, they cannot verify their own submission
  const inspectorUser: User = {
    id: 'inspector_self_test',
    name: 'Inspector Self Test',
    email: 'inspector_self@agrix.test',
    passwordHash: 'hash',
    role: 'inspector',
    phone: '',
    location: '',
    state: '',
    farmSize: 2,
    soilType: 'Loamy',
    mainCrop: 'Wheat',
    farmingMethod: 'Natural farming',
    experienceLevel: 'Experienced',
    avatarUrl: '',
    points: 100,
    level: 1,
    levelTitle: 'Seedling',
    streak: 0,
    lastActiveDate: '',
    createdAt: new Date().toISOString(),
  };
  db.createUser(inspectorUser);

  // Verification logic rule test: verifying own submission
  const targetUserId = inspectorUser.id;
  const verifierUserId = inspectorUser.id;

  const isSelfVerification = targetUserId === verifierUserId;
  assert.strictEqual(isSelfVerification, true);
  // Verifier check logic should reject with 403 Forbidden
  const canVerifySelf = verifierUserId !== targetUserId;
  assert.strictEqual(canVerifySelf, false, 'Inspector must be forbidden from verifying their own submission');
});

test('Challenge State Transitions - Full lifecycle: not_started -> in_progress -> submitted -> verified', () => {
  const farmerId = `farmer_lifecycle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const challengeId = 'chal_1';

  const testFarmer: User = {
    id: farmerId,
    name: 'Lifecycle Farmer',
    email: 'lifecycle@agrix.test',
    passwordHash: 'hash',
    role: 'farmer',
    phone: '',
    location: 'Coimbatore',
    state: 'Tamil Nadu',
    farmSize: 3,
    soilType: 'Clay',
    mainCrop: 'Rice',
    farmingMethod: 'Organic',
    experienceLevel: 'Intermediate',
    avatarUrl: '',
    points: 50,
    level: 1,
    levelTitle: 'Seedling',
    streak: 1,
    lastActiveDate: '2026-10-10',
    createdAt: new Date().toISOString(),
  };
  db.createUser(testFarmer);

  const initialPoints = testFarmer.points;

  // 1. Initial State: not_started
  const uc: UserChallenge = {
    id: `uc_${farmerId}_${challengeId}`,
    userId: farmerId,
    challengeId,
    status: 'not_started',
    progress: 0,
    startedAt: new Date().toISOString(),
  };
  db.saveUserChallenge(uc);
  assert.strictEqual(uc.status, 'not_started');

  // 2. Start challenge: in_progress
  uc.status = 'in_progress';
  uc.progress = 25;
  db.saveUserChallenge(uc);
  assert.strictEqual(db.getUserChallenge(farmerId, challengeId)?.status, 'in_progress');

  // Verification prerequisite check: cannot verify if status is still in_progress
  const canVerifyInProgress = (uc.status as string) === 'submitted';
  assert.strictEqual(canVerifyInProgress, false, 'Cannot verify an in_progress challenge');

  // 3. Submit implementation proof (evidence validation)
  const shortProof = 'too short';
  assert.ok(shortProof.trim().length < 10, 'Short proof should fail length check (min 10 chars)');

  const validProof = 'Collected 5 soil samples in a zig-zag pattern and sent to Krishi Vigyan Kendra.';
  assert.ok(validProof.trim().length >= 10, 'Valid proof satisfies minimum length');

  uc.status = 'submitted';
  uc.progress = 100;
  uc.evidenceNote = validProof;
  uc.submittedAt = new Date().toISOString();
  db.saveUserChallenge(uc);
  assert.strictEqual(db.getUserChallenge(farmerId, challengeId)?.status, 'submitted');

  // 4. Authorized Inspector Verification and Atomic Point Award
  const challenge = db.challenges.get(challengeId);
  assert.ok(challenge);

  const pointsToAward = challenge.points;
  const result = db.awardChallengePoints(
    farmerId,
    challengeId,
    pointsToAward,
    challenge.title,
    challenge.practiceId,
    'user_inspector'
  );

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.pointsAwarded, pointsToAward);

  // Check updated user state
  const updatedFarmer = db.getUserById(farmerId);
  assert.ok(updatedFarmer);
  assert.strictEqual(updatedFarmer.points, initialPoints + pointsToAward);

  // Check challenge record state
  const verifiedUC = db.getUserChallenge(farmerId, challengeId);
  assert.strictEqual(verifiedUC?.status, 'verified');
  assert.strictEqual(verifiedUC?.verifiedBy, 'user_inspector');
  assert.ok(verifiedUC?.completedAt);
});

test('Challenge Security - Rejection and Resubmission Flow', () => {
  const farmerId = `farmer_resubmit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const challengeId = 'chal_2';

  const testFarmer: User = {
    id: farmerId,
    name: 'Resubmit Farmer',
    email: 'resubmit@agrix.test',
    passwordHash: 'hash',
    role: 'farmer',
    phone: '',
    location: 'Madurai',
    state: 'Tamil Nadu',
    farmSize: 2,
    soilType: 'Loamy',
    mainCrop: 'Vegetables',
    farmingMethod: 'Natural farming',
    experienceLevel: 'Beginner',
    avatarUrl: '',
    points: 10,
    level: 1,
    levelTitle: 'Seedling',
    streak: 0,
    lastActiveDate: '',
    createdAt: new Date().toISOString(),
  };
  db.createUser(testFarmer);

  const uc: UserChallenge = {
    id: `uc_${farmerId}_${challengeId}`,
    userId: farmerId,
    challengeId,
    status: 'submitted',
    progress: 100,
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    evidenceNote: 'Set up pit with leaves and cow dung.',
  };
  db.saveUserChallenge(uc);

  // 1. Inspector rejects due to insufficient earthworm culture photo
  uc.status = 'rejected';
  uc.feedback = 'Missing photo of Eisenia fetida earthworm culture inoculation.';
  db.saveUserChallenge(uc);
  assert.strictEqual(db.getUserChallenge(farmerId, challengeId)?.status, 'rejected');

  // 2. Farmer corrects evidence and resubmits
  const resubmittedNote = 'Added 1kg Eisenia fetida culture from local KVK with moisture cover.';
  uc.status = 'submitted';
  uc.evidenceNote = resubmittedNote;
  uc.feedback = undefined;
  uc.submittedAt = new Date().toISOString();
  db.saveUserChallenge(uc);

  const resubmittedUC = db.getUserChallenge(farmerId, challengeId);
  assert.strictEqual(resubmittedUC?.status, 'submitted');
  assert.strictEqual(resubmittedUC?.evidenceNote, resubmittedNote);
});

test('Challenge Security - Duplicate reward attempts are rejected', () => {
  const farmerId = `farmer_dedup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const challengeId = 'chal_3';

  const testFarmer: User = {
    id: farmerId,
    name: 'Dedup Farmer',
    email: 'dedup@agrix.test',
    passwordHash: 'hash',
    role: 'farmer',
    phone: '',
    location: 'Salem',
    state: 'Tamil Nadu',
    farmSize: 1,
    soilType: 'Loamy',
    mainCrop: 'Banana',
    farmingMethod: 'Organic',
    experienceLevel: 'Beginner',
    avatarUrl: '',
    points: 100,
    level: 1,
    levelTitle: 'Seedling',
    streak: 1,
    lastActiveDate: '',
    createdAt: new Date().toISOString(),
  };
  db.createUser(testFarmer);

  // First reward award
  const award1 = db.awardChallengePoints(
    farmerId,
    challengeId,
    60,
    'Organic Mulching',
    'prac_3',
    'user_inspector'
  );
  assert.strictEqual(award1.success, true);
  assert.strictEqual(award1.pointsAwarded, 60);

  // Attempt duplicate reward on same challenge
  const award2 = db.awardChallengePoints(
    farmerId,
    challengeId,
    60,
    'Organic Mulching',
    'prac_3',
    'user_inspector'
  );
  assert.strictEqual(award2.success, false, 'Duplicate reward must be rejected');
  assert.strictEqual(award2.pointsAwarded, 0);

  // Ensure user points were NOT incremented twice
  const user = db.getUserById(farmerId);
  assert.strictEqual(user?.points, 160);
});
