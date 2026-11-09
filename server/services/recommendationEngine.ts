import { db } from '../db/store';
import { SustainablePractice, User, FactorWeights, FactorScores } from '../db/types';

export interface ScoredPractice {
  practice: SustainablePractice;
  matchScore: number; // 0 to 100
  matchReasons: string[];
  whyRecommended: string;
  factorScores?: FactorScores;
  factorWeights?: FactorWeights;
  algorithm?: 'baseline' | 'weighted_multifactor';
  safetyWarning?: string;
  isSafetyFiltered?: boolean;
}

export const DEFAULT_FACTOR_WEIGHTS: FactorWeights = {
  crop: 0.25,
  soil: 0.20,
  season: 0.15,
  location: 0.15,
  farmingMethod: 0.10,
  experience: 0.10,
  farmSize: 0.05,
};

/**
 * Baseline 5-Factor Recommendation Engine (Preserved for empirical comparison in research)
 */
export class RecommendationEngineBaseline {
  static getRecommendationsForUser(user: Partial<User>, limit: number = 6): ScoredPractice[] {
    const allPractices = Array.from(db.practices.values());

    const scored: ScoredPractice[] = allPractices.map((practice) => {
      let score = 20; // baseline score
      const matchReasons: string[] = [];

      // 1. Crop Match (Weight: 35)
      const cropNorm = user.mainCrop?.toLowerCase() || '';
      const matchesCrop = practice.suitableCrops.some((c) =>
        c.toLowerCase().includes(cropNorm) || cropNorm.includes(c.toLowerCase()) || c.toLowerCase() === 'all'
      );
      if (matchesCrop && cropNorm) {
        score += 35;
        matchReasons.push(`Optimized for your crop (${user.mainCrop})`);
      }

      // 2. Soil Type Match (Weight: 25)
      if (user.soilType && practice.suitableSoilTypes.includes(user.soilType)) {
        score += 25;
        matchReasons.push(`Balances moisture & nutrients in ${user.soilType} soil`);
      }

      // 3. Farming Method Synergy (Weight: 15)
      if (user.farmingMethod && practice.suitableFarmingMethods.includes(user.farmingMethod)) {
        score += 15;
        matchReasons.push(`Aligns with your ${user.farmingMethod} farming approach`);
      }

      // 4. Experience Level Appropriateness (Weight: 10)
      if (user.experienceLevel === 'Beginner' && practice.difficulty === 'Easy') {
        score += 10;
        matchReasons.push('Beginner-friendly sustainable practice with fast adoption');
      } else if (user.experienceLevel === 'Intermediate' && (practice.difficulty === 'Easy' || practice.difficulty === 'Medium')) {
        score += 10;
      } else if (user.experienceLevel === 'Experienced') {
        score += 10;
        if (practice.difficulty === 'Advanced') {
          score += 5;
          matchReasons.push('Advanced practice tailored for experienced farm management');
        }
      }

      // 5. Farm Size Factors
      const farmSize = user.farmSize ?? 2;
      if (farmSize < 2 && practice.category === 'Soil Health') {
        score += 5;
        matchReasons.push('Ideal high-impact practice for small/marginal acreage');
      } else if (farmSize >= 5 && (practice.category === 'Water Conservation' || practice.category === 'Energy Efficiency')) {
        score += 5;
        matchReasons.push('High return on resource efficiency across medium/large acreage');
      }

      let whyRecommended = practice.whyRecommended;
      if (!whyRecommended || matchReasons.length > 0) {
        whyRecommended = `Recommended for your ${user.mainCrop || 'farm'} on ${user.soilType || 'soil'}: ${
          matchReasons[0] || 'Supports overall sustainable farm stewardship.'
        } ${practice.sustainabilityBenefit}`;
      }

      return {
        practice,
        matchScore: Math.min(100, Math.round(score)),
        matchReasons,
        whyRecommended,
        algorithm: 'baseline' as const,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore || b.practice.points - a.practice.points);
    return scored.slice(0, limit);
  }
}

/**
 * Normalized 7-Factor Weighted Recommendation Engine
 * Suitable for IEEE experimental evaluation with transparent multi-factor scoring.
 * 
 * Factor Weights:
 * 1. Crop compatibility – 25% (0.25)
 * 2. Soil compatibility – 20% (0.20)
 * 3. Seasonal suitability – 15% (0.15)
 * 4. Location and agro-climatic suitability – 15% (0.15)
 * 5. Farming method compatibility – 10% (0.10)
 * 6. Farmer experience and difficulty level – 10% (0.10)
 * 7. Farm size suitability – 5% (0.05)
 */
export class WeightedMultiFactorRecommendationEngine {
  static evaluatePractice(
    practice: SustainablePractice,
    user: Partial<User>,
    weights: FactorWeights = DEFAULT_FACTOR_WEIGHTS
  ): ScoredPractice {
    const matchReasons: string[] = [];
    let safetyWarning: string | undefined;
    let isSafetyFiltered = false;

    // Safety checks: AWD on sandy soil is unsafe
    if (practice.id === 'prac_1' && user.soilType === 'Sandy') {
      safetyWarning = 'Safety Notice: Alternate Wetting and Drying (AWD) is discouraged in coarse sandy soil due to excessive percolation rates.';
      isSafetyFiltered = true;
    }

    // --- Factor 1: Crop Compatibility (0-100) ---
    let cropScore = 20; // Default when missing
    if (user.mainCrop) {
      const cropNorm = user.mainCrop.toLowerCase().trim();
      const exactMatch = practice.suitableCrops.some((c) => c.toLowerCase() === cropNorm);
      const partialMatch = practice.suitableCrops.some(
        (c) => c.toLowerCase().includes(cropNorm) || cropNorm.includes(c.toLowerCase()) || c.toLowerCase() === 'all'
      );

      if (exactMatch) {
        cropScore = 100;
        matchReasons.push(`Direct agronomic match for ${user.mainCrop}`);
      } else if (partialMatch) {
        cropScore = 75;
        matchReasons.push(`Broad crop family compatibility with ${user.mainCrop}`);
      } else {
        cropScore = 25; // Incompatible or minor overlap
      }
    }

    // --- Factor 2: Soil Compatibility (0-100) ---
    let soilScore = 20; // Default when missing
    if (user.soilType) {
      if (practice.suitableSoilTypes.includes(user.soilType)) {
        soilScore = 100;
        matchReasons.push(`Optimal physical structure and moisture dynamics in ${user.soilType} soil`);
      } else {
        soilScore = 30;
      }
    }

    // --- Factor 3: Seasonal Suitability (0-100) ---
    // Infer current season if not supplied: Kharif (June-Oct), Rabi (Oct-March), Zaid (March-June)
    const currentMonth = new Date().getMonth(); // 0-indexed: 9 = Oct
    let activeSeason = 'Kharif';
    if (currentMonth >= 9 || currentMonth <= 2) activeSeason = 'Rabi';
    else if (currentMonth >= 2 && currentMonth <= 5) activeSeason = 'Zaid';
    else activeSeason = 'Kharif';

    let seasonScore = 50;
    const seasonMatch = practice.suitableSeasons.some(
      (s) => s.toLowerCase() === activeSeason.toLowerCase() || s.toLowerCase() === 'all season'
    );
    if (seasonMatch) {
      seasonScore = 100;
      matchReasons.push(`Seasonally synchronized for active ${activeSeason} window`);
    } else {
      seasonScore = 40;
    }

    // --- Factor 4: Location & Agro-climatic Suitability (0-100) ---
    let locationScore = 40;
    const userState = user.state || '';
    const userLocation = user.location || '';
    const states = practice.suitableStates || ['All'];

    const matchesState = states.some(
      (s) => s === 'All' || s.toLowerCase() === userState.toLowerCase() || userLocation.toLowerCase().includes(s.toLowerCase())
    );

    if (matchesState) {
      locationScore = 95;
      if (userState) {
        matchReasons.push(`Agro-climatically adapted to conditions in ${userState}`);
      }
    } else if (states.includes('All')) {
      locationScore = 80;
    } else {
      locationScore = 45;
    }

    // --- Factor 5: Farming Method Compatibility (0-100) ---
    let farmingMethodScore = 30;
    if (user.farmingMethod) {
      if (practice.suitableFarmingMethods.includes(user.farmingMethod)) {
        farmingMethodScore = 100;
        matchReasons.push(`Harmonizes with ${user.farmingMethod} farm philosophy`);
      } else if (user.farmingMethod === 'Mixed' || user.farmingMethod === 'Natural farming') {
        farmingMethodScore = 70;
      } else {
        farmingMethodScore = 35;
      }
    }

    // --- Factor 6: Farmer Experience & Practice Difficulty (0-100) ---
    let experienceScore = 50;
    const exp = user.experienceLevel || 'Intermediate';
    const diff = practice.difficulty;

    if (exp === 'Beginner') {
      if (diff === 'Easy') experienceScore = 100;
      else if (diff === 'Medium') experienceScore = 65;
      else experienceScore = 30;
    } else if (exp === 'Intermediate') {
      if (diff === 'Medium') experienceScore = 100;
      else if (diff === 'Easy') experienceScore = 90;
      else experienceScore = 65;
    } else {
      // Experienced
      if (diff === 'Advanced') experienceScore = 100;
      else if (diff === 'Medium') experienceScore = 90;
      else experienceScore = 80;
    }

    // --- Factor 7: Farm Size Suitability (0-100) ---
    let farmSizeScore = 60;
    const size = user.farmSize ?? 2;
    const minSize = practice.minFarmSize ?? 0;
    const maxSize = practice.maxFarmSize ?? 100;

    if (size >= minSize && size <= maxSize) {
      farmSizeScore = 100;
    } else if (size < minSize) {
      farmSizeScore = Math.max(30, 100 - Math.round((minSize - size) * 20));
    } else {
      farmSizeScore = Math.max(40, 100 - Math.round((size - maxSize) * 5));
    }

    // Calculate Normalized Weighted Sum
    const weightedSum =
      weights.crop * cropScore +
      weights.soil * soilScore +
      weights.season * seasonScore +
      weights.location * locationScore +
      weights.farmingMethod * farmingMethodScore +
      weights.experience * experienceScore +
      weights.farmSize * farmSizeScore;

    // Apply safety filter penalty if critical condition violated
    let finalScore = isSafetyFiltered ? Math.min(25, weightedSum * 0.3) : weightedSum;
    finalScore = Math.round(Math.max(0, Math.min(100, finalScore)));

    const factorScores: FactorScores = {
      cropScore,
      soilScore,
      seasonScore,
      locationScore,
      farmingMethodScore,
      experienceScore,
      farmSizeScore,
    };

    let whyRecommended = practice.whyRecommended;
    if (!whyRecommended || matchReasons.length > 0) {
      const topReasons = matchReasons.slice(0, 2).join('; ');
      whyRecommended = `${topReasons}. ${practice.sustainabilityBenefit}`;
    }

    return {
      practice,
      matchScore: finalScore,
      matchReasons,
      whyRecommended,
      factorScores,
      factorWeights: weights,
      algorithm: 'weighted_multifactor',
      safetyWarning,
      isSafetyFiltered,
    };
  }

  static getRecommendationsForUser(
    user: Partial<User>,
    limit: number = 6,
    weights: FactorWeights = DEFAULT_FACTOR_WEIGHTS
  ): ScoredPractice[] {
    const allPractices = Array.from(db.practices.values());

    const scored = allPractices.map((practice) =>
      this.evaluatePractice(practice, user, weights)
    );

    // Sort descending by matchScore, then by points
    scored.sort((a, b) => b.matchScore - a.matchScore || b.practice.points - a.practice.points);

    return scored.slice(0, limit);
  }
}

// Default export uses WeightedMultiFactorRecommendationEngine as standard
export const RecommendationEngine = WeightedMultiFactorRecommendationEngine;
