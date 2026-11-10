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

test('Recommendation Engine - Missing data yields neutral baseline scoring (50%) without silent assumptions', () => {
  // Completely empty farmer profile
  const emptyFarmer = {};

  const recs = WeightedMultiFactorRecommendationEngine.getRecommendationsForUser(emptyFarmer, 3);
  assert.ok(recs.length > 0);

  // Evaluate single practice to inspect factor scores
  const samplePractice = Array.from(db.practices.values())[0];
  const evalEmpty = WeightedMultiFactorRecommendationEngine.evaluatePractice(samplePractice, emptyFarmer);

  assert.strictEqual(evalEmpty.factorScores?.cropScore, 50, 'Missing crop should yield neutral 50%');
  assert.strictEqual(evalEmpty.factorScores?.soilScore, 50, 'Missing soil should yield neutral 50%');
  assert.strictEqual(evalEmpty.factorScores?.experienceScore, 50, 'Missing experience should yield neutral 50%');
  assert.strictEqual(evalEmpty.factorScores?.farmSizeScore, 50, 'Missing farmSize should yield neutral 50%');
  assert.ok(
    evalEmpty.matchReasons.some((r) => r.includes('unspecified') || r.includes('neutral')),
    'Match reasons should explicitly state neutral baseline scoring'
  );
});

test('Recommendation Engine - Boundary inputs (negative farm size, extreme acreage) handled gracefully', () => {
  const negativeFarmer = {
    mainCrop: 'Rice',
    soilType: 'Clay' as const,
    farmSize: -5, // Invalid negative size
  };

  const samplePractice = Array.from(db.practices.values())[0];
  const evalNeg = WeightedMultiFactorRecommendationEngine.evaluatePractice(samplePractice, negativeFarmer);
  assert.strictEqual(evalNeg.factorScores?.farmSizeScore, 50, 'Negative farm size should trigger neutral baseline');
  assert.ok(!isNaN(evalNeg.matchScore));

  const extremeFarmer = {
    mainCrop: 'Wheat',
    soilType: 'Loamy' as const,
    farmSize: 5000, // Extreme acreage clamped to 1000
  };

  const evalExtreme = WeightedMultiFactorRecommendationEngine.evaluatePractice(samplePractice, extremeFarmer);
  assert.ok(!isNaN(evalExtreme.matchScore));
  assert.ok(evalExtreme.factorScores!.farmSizeScore >= 0 && evalExtreme.factorScores!.farmSizeScore <= 100);
});

test('Recommendation Engine - Custom weights normalization', () => {
  const customWeights = {
    crop: 5,
    soil: 5,
    season: 0,
    location: 0,
    farmingMethod: 0,
    experience: 0,
    farmSize: 0,
  };

  const samplePractice = Array.from(db.practices.values())[0];
  const evaluated = WeightedMultiFactorRecommendationEngine.evaluatePractice(
    samplePractice,
    { mainCrop: 'Rice', soilType: 'Clay' },
    customWeights
  );

  assert.strictEqual(evaluated.factorWeights!.crop, 0.5);
  assert.strictEqual(evaluated.factorWeights!.soil, 0.5);
  assert.strictEqual(evaluated.factorWeights!.season, 0);
});

