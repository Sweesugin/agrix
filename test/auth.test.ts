import { test } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { getJwtSecret, generateToken, authenticate, requireAdmin, requireVerifier, AuthRequest } from '../server/middleware/auth';
import { db } from '../server/db/store';
import { User } from '../server/db/types';

test('Auth Security - Requires non-empty JWT_SECRET from environment', () => {
  const originalSecret = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(
      () => getJwtSecret(),
      /JWT_SECRET environment variable is missing or empty/,
      'Should throw an error when JWT_SECRET is unset'
    );

    process.env.JWT_SECRET = '   ';
    assert.throws(
      () => getJwtSecret(),
      /JWT_SECRET environment variable is missing or empty/,
      'Should throw an error when JWT_SECRET is whitespace'
    );
  } finally {
    process.env.JWT_SECRET = originalSecret || 'agrix_dev_jwt_secret_key_research_prototype_2026_min_32_chars';
  }
});

test('Auth Security - Generates and verifies valid cryptographic JWT tokens', () => {
  const secret = 'test_secret_key_minimum_32_characters_for_security';
  process.env.JWT_SECRET = secret;

  const testUser: User = {
    id: 'test_user_auth_1',
    name: 'Test Farmer',
    email: 'farmer@test.org',
    passwordHash: 'hashed_password',
    role: 'farmer',
    phone: '',
    location: 'Anand',
    state: 'Gujarat',
    farmSize: 2,
    soilType: 'Loamy',
    mainCrop: 'Tomato',
    farmingMethod: 'Organic',
    experienceLevel: 'Intermediate',
    avatarUrl: '',
    points: 100,
    level: 1,
    levelTitle: 'Seedling',
    streak: 1,
    lastActiveDate: '2026-10-10',
    createdAt: '2026-10-10T00:00:00Z',
  };

  db.createUser(testUser);

  const token = generateToken(testUser);
  assert.ok(token && typeof token === 'string');

  const decoded = jwt.verify(token, secret) as any;
  assert.strictEqual(decoded.id, testUser.id);
  assert.strictEqual(decoded.email, testUser.email);
  assert.strictEqual(decoded.role, testUser.role);
});

test('Auth Security - Restricts x-demo-user-id to development mode only', () => {
  const testUser = db.getUserById('user_ramesh');
  assert.ok(testUser);

  // 1. In development mode (NODE_ENV !== 'production'), x-demo-user-id is accepted
  process.env.NODE_ENV = 'development';
  let passedDev = false;
  const mockReqDev: AuthRequest = {
    headers: { 'x-demo-user-id': 'user_ramesh' },
  } as any;
  const mockResDev: any = {
    status: (code: number) => ({ json: (data: any) => data }),
  };
  authenticate(mockReqDev, mockResDev, () => {
    passedDev = true;
  });
  assert.strictEqual(passedDev, true, 'Development mode should allow x-demo-user-id');
  assert.strictEqual(mockReqDev.user?.id, 'user_ramesh');

  // 2. In production mode (NODE_ENV === 'production'), x-demo-user-id MUST be ignored
  process.env.NODE_ENV = 'production';
  let passedProd = false;
  let statusCode = 0;
  let errorResponse = '';
  const mockReqProd: AuthRequest = {
    headers: { 'x-demo-user-id': 'user_ramesh' },
  } as any;
  const mockResProd: any = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (data: any) => {
          errorResponse = data.error;
        },
      };
    },
  };
  authenticate(mockReqProd, mockResProd, () => {
    passedProd = true;
  });

  assert.strictEqual(passedProd, false, 'Production mode MUST NOT allow x-demo-user-id');
  assert.strictEqual(statusCode, 401, 'Should return HTTP 401 Unauthorized');
  assert.ok(errorResponse.includes('Authentication token is required'));

  // Reset NODE_ENV to development
  process.env.NODE_ENV = 'development';
});

test('Auth Security - Enforces role-based authorization in requireAdmin and requireVerifier', () => {
  // Farmer role check on requireAdmin
  let farmerAllowedAdmin = false;
  let farmerAdminStatus = 0;
  const farmerReq: AuthRequest = {
    user: { id: 'farmer_1', role: 'farmer' } as any,
  } as any;
  const farmerRes: any = {
    status: (code: number) => {
      farmerAdminStatus = code;
      return { json: (d: any) => d };
    },
  };
  requireAdmin(farmerReq, farmerRes, () => {
    farmerAllowedAdmin = true;
  });
  assert.strictEqual(farmerAllowedAdmin, false, 'Farmer must not access admin endpoints');
  assert.strictEqual(farmerAdminStatus, 403, 'Must return 403 Forbidden for farmer on requireAdmin');

  // Inspector role check on requireAdmin (inspector is not superadmin)
  let inspectorAllowedAdmin = false;
  let inspectorAdminStatus = 0;
  const inspectorReq: AuthRequest = {
    user: { id: 'inspector_1', role: 'inspector' } as any,
  } as any;
  const inspectorRes: any = {
    status: (code: number) => {
      inspectorAdminStatus = code;
      return { json: (d: any) => d };
    },
  };
  requireAdmin(inspectorReq, inspectorRes, () => {
    inspectorAllowedAdmin = true;
  });
  assert.strictEqual(inspectorAllowedAdmin, false, 'Inspector must not access superadmin endpoints');
  assert.strictEqual(inspectorAdminStatus, 403);

  // Inspector role check on requireVerifier (inspector IS allowed to verify)
  let inspectorAllowedVerifier = false;
  requireVerifier(inspectorReq, inspectorRes, () => {
    inspectorAllowedVerifier = true;
  });
  assert.strictEqual(inspectorAllowedVerifier, true, 'Inspector MUST be allowed on requireVerifier');

  // Admin role check on requireVerifier (admin IS allowed to verify)
  let adminAllowedVerifier = false;
  const adminReq: AuthRequest = {
    user: { id: 'admin_1', role: 'admin' } as any,
  } as any;
  requireVerifier(adminReq, farmerRes, () => {
    adminAllowedVerifier = true;
  });
  assert.strictEqual(adminAllowedVerifier, true, 'Admin MUST be allowed on requireVerifier');

  // Farmer role check on requireVerifier (farmer CANNOT verify)
  let farmerAllowedVerifier = false;
  let farmerVerifierStatus = 0;
  const verifierRes: any = {
    status: (code: number) => {
      farmerVerifierStatus = code;
      return { json: (d: any) => d };
    },
  };
  requireVerifier(farmerReq, verifierRes, () => {
    farmerAllowedVerifier = true;
  });
  assert.strictEqual(farmerAllowedVerifier, false, 'Farmer MUST NOT be allowed on requireVerifier');
  assert.strictEqual(farmerVerifierStatus, 403, 'Must return 403 Forbidden');
});
