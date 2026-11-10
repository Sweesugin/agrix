import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateAndSanitizeExplanation,
  explainPracticeWithAI,
  askAgriXAssistant,
  DISCLAIMER_TEXT,
  AIExplainedPractice,
} from '../server/services/gemini';
import { db } from '../server/db/store';
import { SustainablePractice } from '../server/db/types';

test('AI Accuracy - Educational disclaimer warns about prototype boundaries and safety', () => {
  assert.ok(DISCLAIMER_TEXT.includes('educational agronomic guidance'));
  assert.ok(DISCLAIMER_TEXT.includes('ICAR'));
  assert.ok(DISCLAIMER_TEXT.includes('does not prescribe custom chemical quantities'));
  assert.ok(DISCLAIMER_TEXT.includes('Krishi Vigyan Kendra'));
});

test('AI Accuracy - validateAndSanitizeExplanation handles malformed, empty, or partial AI responses safely', () => {
  const awdPractice = db.practices.get('prac_1')!;
  assert.ok(awdPractice, 'AWD practice should exist in seed data');

  // Completely empty AI response payload
  const emptyAiPayload: Partial<AIExplainedPractice> = {};

  const sanitized = validateAndSanitizeExplanation(emptyAiPayload, awdPractice, {
    mainCrop: 'Rice',
    soilType: 'Clay',
  }, 'gemini');

  // Should fallback to verified database attributes
  assert.strictEqual(sanitized.practiceId, awdPractice.id);
  assert.strictEqual(sanitized.practiceTitle, awdPractice.title);
  assert.strictEqual(sanitized.overview, awdPractice.description);
  assert.ok(sanitized.stepByStepGuidance.length >= 3);
  assert.ok(sanitized.requiredMaterials.length >= 1);
  assert.ok(sanitized.precautions.length >= 1);
  assert.strictEqual(sanitized.isAIGenerated, true);
  assert.strictEqual(sanitized.source, 'gemini');
  assert.strictEqual(sanitized.disclaimer, DISCLAIMER_TEXT);

  // Source citation MUST match verified database record
  assert.strictEqual(sanitized.sourceCitation, awdPractice.sourceCitation);
  assert.strictEqual(sanitized.verifiedAttributes.verifiedSource, awdPractice.sourceCitation);
});

test('AI Accuracy - Distinguishes AI-generated responses from rule fallbacks', () => {
  const practice = db.practices.get('prac_2')!;
  assert.ok(practice);

  // 1. Rule fallback
  const fallback = validateAndSanitizeExplanation({}, practice, undefined, 'rule_fallback');
  assert.strictEqual(fallback.isAIGenerated, false);
  assert.strictEqual(fallback.source, 'rule_fallback');

  // 2. Gemini generated
  const gemini = validateAndSanitizeExplanation({ overview: 'Valid custom generated explanation' }, practice, undefined, 'gemini');
  assert.strictEqual(gemini.isAIGenerated, true);
  assert.strictEqual(gemini.source, 'gemini');
});

test('AI Accuracy - Does not invent agricultural source citations; preserves catalogue citations', () => {
  const allPractices = Array.from(db.practices.values());
  assert.ok(allPractices.length >= 8);

  for (const practice of allPractices) {
    // Verified citations must reference recognized institutions
    const citation = practice.sourceCitation || '';
    assert.ok(
      citation.includes('ICAR') ||
        citation.includes('TNAU') ||
        citation.includes('IRRI') ||
        citation.includes('CRRI') ||
        citation.includes('KVK') ||
        citation.includes('IIOR') ||
        citation.includes('National'),
      `Practice ${practice.id} (${practice.title}) citation '${citation}' should be from a recognized agricultural body`
    );

    const explained = validateAndSanitizeExplanation({}, practice, undefined, 'rule_fallback');
    assert.strictEqual(explained.sourceCitation, practice.sourceCitation);
  }
});

test('AI Accuracy - Safe fallback behavior when GEMINI_API_KEY is not available', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;

    const practice = db.practices.get('prac_1')!;
    const explanation = await explainPracticeWithAI(practice, { mainCrop: 'Rice' });

    assert.ok(explanation);
    assert.strictEqual(explanation.source, 'rule_fallback');
    assert.strictEqual(explanation.isAIGenerated, false);
    assert.ok(explanation.overview.length > 20);
    assert.strictEqual(explanation.sourceCitation, practice.sourceCitation);

    const assistantReply = await askAgriXAssistant('How do I manage stem borer?');
    assert.ok(assistantReply.reply);
    assert.strictEqual(assistantReply.source, 'rule_fallback');
    assert.strictEqual(assistantReply.isAIGenerated, false);
    assert.ok(assistantReply.disclaimer.includes('educational'));
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }
});
