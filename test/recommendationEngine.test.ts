import { test } from 'node:test';
import assert from 'node:assert';
import {
  WeightedMultiFactorRecommendationEngine,
  RecommendationEngineBaseline,
  DEFAULT_FACTOR_WEIGHTS,
} from '../server/services/recommendationEngine';
import { db } from '../server/db/store';

test('Recommendation Engine - Default Factor Weights sum to 1.0', () => {
  const sum =
    DEFAULT_FACTOR_WEIGHTS.crop +
    DEFAULT_FACTOR_WEIGHTS.soil +
    DEFAULT_FACTOR_WEIGHTS.season +
    DEFAULT_FACTOR_WEIGHTS.location +
    DEFAULT_FACTOR_WEIGHTS.farmingMethod +
    DEFAULT_FACTOR_WEIGHTS.experience +
    DEFAULT_FACTOR_WEIGHTS.farmSize;

  assert.strictEqual(Math.round(sum * 100) / 100, 1.0);
});

test('Recommendation Engine - Scores crop and soil compatibility appropriately', () => {
  const riceFarmer = {
    mainCrop: 'Rice',
    soilType: 'Clay' as const,
    farmingMethod: 'Natural farming' as const,
    experienceLevel: 'Experienced' as const,
    farmSize: 5.0,
    state: 'Tamil Nadu',
    location: 'Thanjavur',
  };

  const recs = WeightedMultiFactorRecommendationEngine.getRecommendationsForUser(riceFarmer, 6);
  assert.ok(recs.length > 0);

  // AWD (prac_1) is optimized for Rice in clay soil
  const awdRec = recs.find((r) => r.practice.id === 'prac_1');
  assert.ok(awdRec, 'AWD should be recommended for clay rice paddies');
  assert.ok(awdRec.matchScore >= 70, `Expected AWD matchScore >= 70, got ${awdRec.matchScore}`);
  assert.strictEqual(awdRec.factorScores?.cropScore, 100);
  assert.strictEqual(awdRec.factorScores?.soilScore, 100);
});

test('Recommendation Engine - Safety constraint triggers for AWD on Sandy soil', () => {
  const sandyRiceFarmer = {
    mainCrop: 'Rice',
    soilType: 'Sandy' as const,
    farmingMethod: 'Conventional' as const,
    experienceLevel: 'Beginner' as const,
    farmSize: 2.0,
  };

  const awdPractice = db.practices.get('prac_1');
  assert.ok(awdPractice);

  const evaluation = WeightedMultiFactorRecommendationEngine.evaluatePractice(
    awdPractice,
    sandyRiceFarmer
  );

  assert.strictEqual(evaluation.isSafetyFiltered, true);
  assert.ok(evaluation.safetyWarning?.includes('Safety Notice'));
  assert.ok(evaluation.matchScore <= 30, 'Score should be capped down due to sandy soil incompatibility');
});

test('Recommendation Engine - Baseline Heuristic produces valid rankings', () => {
  const tomatoFarmer = {
    mainCrop: 'Tomato',
    soilType: 'Loamy' as const,
    farmingMethod: 'Organic' as const,
    experienceLevel: 'Intermediate' as const,
    farmSize: 3.0,
  };

  const recs = RecommendationEngineBaseline.getRecommendationsForUser(tomatoFarmer, 6);
  assert.strictEqual(recs.length, 6);
  assert.ok(recs[0].matchScore >= recs[1].matchScore, 'Should be sorted descending');
});
