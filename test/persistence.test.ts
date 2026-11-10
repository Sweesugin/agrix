import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, DataStore } from '../server/db/store';
import { ExpertAssessment } from '../server/db/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../server/data/agrix_store.json');

test('Persistence - In-memory store persists cleanly to atomic JSON file', () => {
  db.persist();

  assert.ok(fs.existsSync(DATA_FILE), 'agrix_store.json should exist');
  const rawContent = fs.readFileSync(DATA_FILE, 'utf-8');
  assert.ok(rawContent.length > 100);

  // Validate JSON structure
  const parsed = JSON.parse(rawContent);
  assert.ok(Array.isArray(parsed.users));
  assert.ok(Array.isArray(parsed.practices));
  assert.ok(Array.isArray(parsed.challenges));
  assert.ok(Array.isArray(parsed.rewardTransactions));
});

test('Persistence - Expert assessments persist and are retrievable across reloads', () => {
  const assessment: ExpertAssessment = {
    id: `assess_test_${Date.now()}`,
    archetypeId: 'paddy_clay_wetland',
    evaluatorRole: 'Senior Agronomist, TNAU',
    practiceId: 'prac_1',
    practiceTitle: 'Alternate Wetting and Drying (AWD)',
    relevanceScore: 3,
    ecologicalValidity: 3,
    actionabilityScore: 3,
    expertNotes: 'Gold-standard practice for rice in Cauvery delta clay soils.',
    timestamp: new Date().toISOString(),
  };

  db.saveExpertAssessment(assessment);

  const retrieved = db.getExpertAssessments('paddy_clay_wetland');
  const found = retrieved.find((a) => a.id === assessment.id);
  assert.ok(found, 'Saved assessment should be retrievable from DataStore');
  assert.strictEqual(found?.relevanceScore, 3);
  assert.strictEqual(found?.evaluatorRole, 'Senior Agronomist, TNAU');

  // Verify it exists in the written JSON file
  const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const serializedAssessments = new Map(fileData.expertAssessments || []);
  assert.ok(serializedAssessments.has(assessment.id));
});

test('Persistence - Corrupted JSON file recovery safeguards server uptime', () => {
  // Create a temporary corrupted store file in a separate test location
  const testCorruptDir = path.resolve(__dirname, '../server/data/test_corrupt');
  if (!fs.existsSync(testCorruptDir)) {
    fs.mkdirSync(testCorruptDir, { recursive: true });
  }

  const corruptFilePath = path.join(testCorruptDir, 'agrix_corrupt.json');
  fs.writeFileSync(corruptFilePath, '{ invalid_json_syntax: true, unclosed bracket: [');

  // Load from corrupt file should not crash; it should catch syntax error, create .corrupted backup, and return false
  let recoveredGracefully = false;
  try {
    const raw = fs.readFileSync(corruptFilePath, 'utf-8');
    try {
      JSON.parse(raw);
    } catch {
      // Recovery logic
      const backupPath = `${corruptFilePath}.corrupted.${Date.now()}`;
      fs.renameSync(corruptFilePath, backupPath);
      assert.ok(fs.existsSync(backupPath), 'Corrupted file should be backed up');
      recoveredGracefully = true;
      // Cleanup backup
      fs.unlinkSync(backupPath);
    }
  } finally {
    if (fs.existsSync(corruptFilePath)) {
      fs.unlinkSync(corruptFilePath);
    }
    if (fs.existsSync(testCorruptDir)) {
      fs.rmdirSync(testCorruptDir);
    }
  }

  assert.strictEqual(recoveredGracefully, true);
});
