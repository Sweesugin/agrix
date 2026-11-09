import { db } from '../db/store';
import { SustainablePractice, User } from '../db/types';

export interface ScoredPractice {
  practice: SustainablePractice;
  matchScore: number; // 0 to 100
  matchReasons: string[];
  whyRecommended: string;
}

export class RecommendationEngine {
  /**
   * Rule-based scoring algorithm designed with modular extensibility
   * for future integration with predictive ML models.
   */
  static getRecommendationsForUser(user: User, limit: number = 5): ScoredPractice[] {
    const allPractices = Array.from(db.practices.values());

    const scored: ScoredPractice[] = allPractices.map((practice) => {
      let score = 20; // baseline score
      const matchReasons: string[] = [];

      // 1. Crop Match (Weight: 35)
      const cropNorm = user.mainCrop?.toLowerCase() || '';
      const matchesCrop = practice.suitableCrops.some((c) =>
        c.toLowerCase().includes(cropNorm) || cropNorm.includes(c.toLowerCase()) || c.toLowerCase() === 'all'
      );
      if (matchesCrop) {
        score += 35;
        matchReasons.push(`Highly optimized for your crop (${user.mainCrop})`);
      }

      // 2. Soil Type Match (Weight: 25)
      if (practice.suitableSoilTypes.includes(user.soilType)) {
        score += 25;
        matchReasons.push(`Balances moisture & nutrients in ${user.soilType} soil`);
      }

      // 3. Farming Method Synergy (Weight: 15)
      if (practice.suitableFarmingMethods.includes(user.farmingMethod)) {
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
      if (user.farmSize < 2 && practice.category === 'Soil Health') {
        score += 5;
        matchReasons.push('Ideal high-impact practice for small/marginal acreage');
      } else if (user.farmSize >= 5 && (practice.category === 'Water Conservation' || practice.category === 'Energy Efficiency')) {
        score += 5;
        matchReasons.push('High return on resource efficiency across medium/large acreage');
      }

      // Compose dynamic natural whyRecommended string
      let whyRecommended = practice.whyRecommended;
      if (!whyRecommended || matchReasons.length > 0) {
        whyRecommended = `Recommended for your ${user.mainCrop} on ${user.soilType} soil: ${matchReasons[0] || 'Supports overall sustainable farm stewardship.'} ${practice.sustainabilityBenefit}`;
      }

      return {
        practice,
        matchScore: Math.min(100, score),
        matchReasons,
        whyRecommended,
      };
    });

    // Sort by matchScore descending, then by points
    scored.sort((a, b) => b.matchScore - a.matchScore || b.practice.points - a.practice.points);

    return scored.slice(0, limit);
  }
}
