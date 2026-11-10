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
 * Validates that factor weights sum to 1.0 (within floating point precision).
 * If weights deviate, normalizes them proportionally so the sum is strictly 1.0.
 */
export function validateAndNormalizeWeights(weights: Partial<FactorWeights> = {}): FactorWeights {
  const merged: FactorWeights = {
    crop: weights.crop ?? DEFAULT_FACTOR_WEIGHTS.crop,
    soil: weights.soil ?? DEFAULT_FACTOR_WEIGHTS.soil,
    season: weights.season ?? DEFAULT_FACTOR_WEIGHTS.season,
    location: weights.location ?? DEFAULT_FACTOR_WEIGHTS.location,
    farmingMethod: weights.farmingMethod ?? DEFAULT_FACTOR_WEIGHTS.farmingMethod,
    experience: weights.experience ?? DEFAULT_FACTOR_WEIGHTS.experience,
    farmSize: weights.farmSize ?? DEFAULT_FACTOR_WEIGHTS.farmSize,
  };

  const sum =
    merged.crop +
    merged.soil +
    merged.season +
    merged.location +
    merged.farmingMethod +
    merged.experience +
    merged.farmSize;

  if (Math.abs(sum - 1.0) > 0.0001 && sum > 0) {
    return {
      crop: Number((merged.crop / sum).toFixed(4)),
      soil: Number((merged.soil / sum).toFixed(4)),
      season: Number((merged.season / sum).toFixed(4)),
      location: Number((merged.location / sum).toFixed(4)),
      farmingMethod: Number((merged.farmingMethod / sum).toFixed(4)),
      experience: Number((merged.experience / sum).toFixed(4)),
      farmSize: Number((merged.farmSize / sum).toFixed(4)),
    };
  }

  return merged;
}

/**
 * Determines current Indian agricultural cropping season based on calendar month:
 * - Kharif (Monsoon/Autumn): July 1 - October 31 (Months 6-9 in 0-indexed JavaScript)
 * - Rabi (Winter/Spring): November 1 - March 31 (Months 10, 11, 0, 1, 2 in 0-indexed JavaScript)
 * - Zaid (Summer): April 1 - June 30 (Months 3-5 in 0-indexed JavaScript)
 */
export function getCalendarCroppingSeason(monthIndex: number = new Date().getMonth()): 'Kharif' | 'Rabi' | 'Zaid' {
  if (monthIndex >= 6 && monthIndex <= 9) {
    return 'Kharif'; // Jul - Oct
  }
  if (monthIndex >= 3 && monthIndex <= 5) {
    return 'Zaid'; // Apr - Jun
  }
  // Months 10, 11 (Nov, Dec) and 0, 1, 2 (Jan, Feb, Mar)
  return 'Rabi';
}

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
      const cropNorm = user.mainCrop?.toLowerCase().trim() || '';
      const matchesCrop = practice.suitableCrops.some((c) =>
        c.toLowerCase() === 'all' || (cropNorm && (c.toLowerCase().includes(cropNorm) || cropNorm.includes(c.toLowerCase())))
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
 * Factor Weights (Total = 1.0):
 * 1. Crop compatibility – 25% (0.25)
 * 2. Soil compatibility – 20% (0.20)
 * 3. Seasonal suitability – 15% (0.15)
 * 4. Location & agro-climatic suitability – 15% (0.15)
 * 5. Farming method compatibility – 10% (0.10)
 * 6. Farmer experience and difficulty level – 10% (0.10)
 * 7. Farm size suitability – 5% (0.05)
 */
export class WeightedMultiFactorRecommendationEngine {
  static evaluatePractice(
    practice: SustainablePractice,
    user: Partial<User> & { currentSeason?: 'Kharif' | 'Rabi' | 'Zaid' },
    weights: FactorWeights = DEFAULT_FACTOR_WEIGHTS
  ): ScoredPractice {
    const normalizedWeights = validateAndNormalizeWeights(weights);
    const matchReasons: string[] = [];
    let safetyWarning: string | undefined;
    let isSafetyFiltered = false;

    // --- Safety Incompatibility Constraint Enforcement ---
    // Rule: AWD (Alternate Wetting and Drying) is strictly contraindicated in coarse Sandy soils
    // due to excessive hydraulic conductivity, lack of hardpan water retention, and severe drought stress risk.
    if ((practice.id === 'prac_1' || practice.title.includes('Alternate Wetting and Drying')) && user.soilType === 'Sandy') {
      safetyWarning = 'Safety Notice: Alternate Wetting and Drying (AWD) is contraindicated in coarse Sandy soil due to high hydraulic percolation and crop moisture stress.';
      isSafetyFiltered = true;
    }

    // --- Factor 1: Crop Compatibility (0-100) ---
    let cropScore = 50; // Neutral baseline when missing/unspecified
    if (!user.mainCrop || user.mainCrop.trim() === '') {
      cropScore = 50;
      matchReasons.push('Crop unspecified: neutral agronomic baseline applied');
    } else {
      const cropNorm = user.mainCrop.toLowerCase().trim();
      const exactMatch = practice.suitableCrops.some((c) => c.toLowerCase() === cropNorm);
      const broadMatch = practice.suitableCrops.some(
        (c) => c.toLowerCase() === 'all' || c.toLowerCase().includes(cropNorm) || cropNorm.includes(c.toLowerCase())
      );

      if (exactMatch) {
        cropScore = 100;
        matchReasons.push(`Direct agronomic match for crop: ${user.mainCrop}`);
      } else if (broadMatch) {
        cropScore = 75;
        matchReasons.push(`Broad crop family compatibility with ${user.mainCrop}`);
      } else {
        cropScore = 20; // Incompatible or minor overlap
      }
    }

    // --- Factor 2: Soil Compatibility (0-100) ---
    let soilScore = 50; // Neutral baseline when missing/unspecified
    if (!user.soilType || user.soilType.trim() === '') {
      soilScore = 50;
      matchReasons.push('Soil type unspecified: neutral physical baseline applied');
    } else {
      if (practice.suitableSoilTypes.includes(user.soilType)) {
        soilScore = 100;
        matchReasons.push(`Optimal moisture & nutrient dynamics in ${user.soilType} soil`);
      } else {
        soilScore = 25; // Sub-optimal or mismatched soil dynamics
      }
    }

    // --- Factor 3: Seasonal Suitability (0-100) ---
    // Do not silently assume a season when the information is missing.
    let seasonScore = 50;
    const specifiedSeason = user.currentSeason;

    if (!specifiedSeason) {
      // Caller has not specified a season; check practice general seasonal breadth
      if (practice.suitableSeasons.some((s) => s.toLowerCase() === 'all season')) {
        seasonScore = 80;
        matchReasons.push('All-season operational suitability');
      } else {
        seasonScore = 50; // Neutral baseline for unspecified season
        matchReasons.push('Season unspecified: neutral baseline scoring applied');
      }
    } else {
      // Evaluate against specified active season
      const seasonMatch = practice.suitableSeasons.some(
        (s) => s.toLowerCase() === specifiedSeason.toLowerCase() || s.toLowerCase() === 'all season'
      );
      if (seasonMatch) {
        seasonScore = 100;
        matchReasons.push(`Seasonally synchronized for active ${specifiedSeason} window`);
      } else {
        seasonScore = 25; // Out-of-season penalty
      }
    }

    // --- Factor 4: Location & Agro-climatic Suitability (0-100) ---
    // Do not silently assume a location/state when missing.
    let locationScore = 50;
    const userState = user.state?.trim() || '';
    const userLocation = user.location?.trim() || '';
    const states = practice.suitableStates || ['All'];

    if (!userState && !userLocation) {
      if (states.includes('All')) {
        locationScore = 80;
        matchReasons.push('Universally adaptable practice across Indian agro-climatic zones');
      } else {
        locationScore = 50; // Neutral baseline when location is missing
        matchReasons.push('Location unspecified: neutral regional scoring applied');
      }
    } else {
      const matchesState = states.some(
        (s) => s === 'All' || (userState && s.toLowerCase() === userState.toLowerCase()) || (userLocation && userLocation.toLowerCase().includes(s.toLowerCase()))
      );

      if (matchesState) {
        locationScore = 100;
        if (userState) {
          matchReasons.push(`Agro-climatically adapted to conditions in ${userState}`);
        }
      } else if (states.includes('All')) {
        locationScore = 80;
      } else {
        locationScore = 30; // Not recommended for this state
      }
    }

    // --- Factor 5: Farming Method Compatibility (0-100) ---
    let farmingMethodScore = 50;
    if (!user.farmingMethod || user.farmingMethod.trim() === '') {
      farmingMethodScore = 50;
    } else if (practice.suitableFarmingMethods.includes(user.farmingMethod)) {
      farmingMethodScore = 100;
      matchReasons.push(`Harmonizes with ${user.farmingMethod} farm philosophy`);
    } else if (user.farmingMethod === 'Mixed' || user.farmingMethod === 'Natural farming') {
      farmingMethodScore = 70;
    } else {
      farmingMethodScore = 30;
    }

    // --- Factor 6: Farmer Experience & Practice Difficulty (0-100) ---
    // Do not silently assume 'Intermediate' when experience is missing.
    let experienceScore = 50;
    const exp = user.experienceLevel;
    const diff = practice.difficulty;

    if (!exp) {
      experienceScore = 50; // Neutral baseline when experience is unspecified
      matchReasons.push('Experience level unspecified: neutral baseline applied');
    } else if (exp === 'Beginner') {
      if (diff === 'Easy') experienceScore = 100;
      else if (diff === 'Medium') experienceScore = 60;
      else experienceScore = 25;
    } else if (exp === 'Intermediate') {
      if (diff === 'Medium') experienceScore = 100;
      else if (diff === 'Easy') experienceScore = 90;
      else experienceScore = 60;
    } else {
      // Experienced
      if (diff === 'Advanced') experienceScore = 100;
      else if (diff === 'Medium') experienceScore = 90;
      else experienceScore = 80;
    }

    // --- Factor 7: Farm Size Suitability (0-100) ---
    // Do not silently assume acreage when farmSize is missing or invalid.
    let farmSizeScore = 50;
    const hasValidFarmSize = typeof user.farmSize === 'number' && !isNaN(user.farmSize) && user.farmSize >= 0;

    if (!hasValidFarmSize) {
      farmSizeScore = 50; // Neutral baseline when farm size is missing or invalid
      matchReasons.push('Farm size unspecified or invalid: neutral baseline applied');
    } else {
      const size = Math.min(1000, user.farmSize!); // clamp extreme boundaries
      const minSize = practice.minFarmSize ?? 0;
      const maxSize = practice.maxFarmSize ?? 100;

      if (size >= minSize && size <= maxSize) {
        farmSizeScore = 100;
      } else if (size < minSize) {
        farmSizeScore = Math.max(30, 100 - Math.round((minSize - size) * 20));
      } else {
        farmSizeScore = Math.max(40, 100 - Math.round((size - maxSize) * 5));
      }
    }


    // Ensure all individual factor scores are bounded strictly in [0, 100]
    cropScore = Math.max(0, Math.min(100, cropScore));
    soilScore = Math.max(0, Math.min(100, soilScore));
    seasonScore = Math.max(0, Math.min(100, seasonScore));
    locationScore = Math.max(0, Math.min(100, locationScore));
    farmingMethodScore = Math.max(0, Math.min(100, farmingMethodScore));
    experienceScore = Math.max(0, Math.min(100, experienceScore));
    farmSizeScore = Math.max(0, Math.min(100, farmSizeScore));

    // Calculate Normalized Weighted Sum
    const weightedSum =
      normalizedWeights.crop * cropScore +
      normalizedWeights.soil * soilScore +
      normalizedWeights.season * seasonScore +
      normalizedWeights.location * locationScore +
      normalizedWeights.farmingMethod * farmingMethodScore +
      normalizedWeights.experience * experienceScore +
      normalizedWeights.farmSize * farmSizeScore;

    // Safety Constraint Filter: Incompatible practices receive a score of 0 and safety warning
    let finalScore = isSafetyFiltered ? 0 : Math.round(weightedSum);
    finalScore = Math.max(0, Math.min(100, finalScore));

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
    if (isSafetyFiltered) {
      whyRecommended = safetyWarning || 'Practice excluded due to agro-ecological safety incompatibility.';
    } else if (!whyRecommended || matchReasons.length > 0) {
      const topReasons = matchReasons.slice(0, 2).join('; ');
      whyRecommended = `${topReasons}. ${practice.sustainabilityBenefit}`;
    }

    return {
      practice,
      matchScore: finalScore,
      matchReasons,
      whyRecommended,
      factorScores,
      factorWeights: normalizedWeights,
      algorithm: 'weighted_multifactor',
      safetyWarning,
      isSafetyFiltered,
    };
  }

  static getRecommendationsForUser(
    user: Partial<User> & { currentSeason?: 'Kharif' | 'Rabi' | 'Zaid' },
    limit: number = 6,
    weights: FactorWeights = DEFAULT_FACTOR_WEIGHTS,
    options: { includeSafetyFiltered?: boolean } = {}
  ): ScoredPractice[] {
    const allPractices = Array.from(db.practices.values());

    let scored = allPractices.map((practice) =>
      this.evaluatePractice(practice, user, weights)
    );

    // Filter out safety-incompatible practices by default to ensure safe agricultural practice
    if (!options.includeSafetyFiltered) {
      scored = scored.filter((r) => !r.isSafetyFiltered);
    }

    // Sort descending by matchScore, then by practice points
    scored.sort((a, b) => b.matchScore - a.matchScore || b.practice.points - a.practice.points);

    return scored.slice(0, limit);
  }
}

// Default export uses WeightedMultiFactorRecommendationEngine as standard
export const RecommendationEngine = WeightedMultiFactorRecommendationEngine;
