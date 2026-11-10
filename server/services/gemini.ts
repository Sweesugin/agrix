import { GoogleGenAI } from '@google/genai';
import { User, SustainablePractice } from '../db/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const DISCLAIMER_TEXT =
  '⚠️ Note: AgriX AI Assistant provides educational agronomic guidance based on verified sustainable agronomy literature (ICAR / TNAU / KVK). This is a prototype system. AgriX does not prescribe custom chemical quantities or guarantee crop yield or financial returns. Always follow official pesticide/fertilizer product label instructions and verify critical pest/disease management with your local Agricultural Extension Officer or Krishi Vigyan Kendra (KVK).';

export interface AIExplainedPractice {
  practiceId: string;
  practiceTitle: string;
  overview: string;
  whyForFarmer: string;
  stepByStepGuidance: string[];
  requiredMaterials: string[];
  precautions: string[];
  expectedBenefits: string[];
  relatedChallengeId: string;
  sourceCitation: string;
  disclaimer: string;
  source: 'gemini' | 'rule_fallback';
  isAIGenerated: boolean;
  verifiedAttributes: {
    category: string;
    suitableCrops: string[];
    suitableSoilTypes: string[];
    verifiedSource: string;
  };
}

/**
 * Validates and sanitizes structured AI-generated practice explanation.
 * Ensures no empty fields, attaches verified record citations, and preserves safe boundaries.
 */
export function validateAndSanitizeExplanation(
  raw: Partial<AIExplainedPractice>,
  practice: SustainablePractice,
  userProfile?: Partial<User>,
  source: 'gemini' | 'rule_fallback' = 'gemini'
): AIExplainedPractice {
  const verifiedAttributes = {
    category: practice.category,
    suitableCrops: practice.suitableCrops,
    suitableSoilTypes: practice.suitableSoilTypes,
    verifiedSource: practice.sourceCitation || 'ICAR Compendium of Sustainable Agricultural Practices',
  };

  const overview =
    raw.overview && raw.overview.trim().length > 15
      ? raw.overview.trim()
      : practice.description;

  const whyForFarmer =
    raw.whyForFarmer && raw.whyForFarmer.trim().length > 15
      ? raw.whyForFarmer.trim()
      : `Recommended for ${userProfile?.mainCrop || 'your crop'} on ${userProfile?.soilType || 'your soil'}. ${practice.sustainabilityBenefit}`;

  const stepByStepGuidance =
    Array.isArray(raw.stepByStepGuidance) && raw.stepByStepGuidance.length > 0
      ? raw.stepByStepGuidance.filter((s) => typeof s === 'string' && s.trim().length > 0)
      : practice.steps && practice.steps.length > 0
      ? practice.steps
      : [
          'Inspect field baseline conditions and soil moisture status.',
          'Prepare tools and inputs in accordance with certified label guidelines.',
          'Implement practice during cooler morning or late afternoon hours.',
          'Monitor field response over 48 to 72 hours.',
        ];

  const requiredMaterials =
    Array.isArray(raw.requiredMaterials) && raw.requiredMaterials.length > 0
      ? raw.requiredMaterials.filter((m) => typeof m === 'string' && m.trim().length > 0)
      : practice.requiredMaterials || ['Standard agricultural implements', 'Protective gloves and eye protection'];

  const precautions =
    Array.isArray(raw.precautions) && raw.precautions.length > 0
      ? raw.precautions.filter((p) => typeof p === 'string' && p.trim().length > 0)
      : practice.precautions || [
          'Follow manufacturer label directions for all botanical preparations',
          'Avoid field applications during heavy wind or high midday temperatures',
        ];

  const expectedBenefits =
    Array.isArray(raw.expectedBenefits) && raw.expectedBenefits.length > 0
      ? raw.expectedBenefits.filter((b) => typeof b === 'string' && b.trim().length > 0)
      : practice.expectedBenefits || [practice.sustainabilityBenefit];

  return {
    practiceId: practice.id,
    practiceTitle: practice.title,
    overview,
    whyForFarmer,
    stepByStepGuidance,
    requiredMaterials,
    precautions,
    expectedBenefits,
    relatedChallengeId: practice.relatedChallengeId,
    sourceCitation: practice.sourceCitation || verifiedAttributes.verifiedSource,
    disclaimer: DISCLAIMER_TEXT,
    source,
    isAIGenerated: source === 'gemini',
    verifiedAttributes,
  };
}

export async function explainPracticeWithAI(
  practice: SustainablePractice,
  userProfile?: Partial<User>
): Promise<AIExplainedPractice> {
  const profileContext = userProfile
    ? `Farmer Details:
- Main Crop: ${userProfile.mainCrop || 'Mixed crops'}
- Soil Type: ${userProfile.soilType || 'Loamy'}
- Farming Method: ${userProfile.farmingMethod || 'Mixed'}
- Farm Size: ${userProfile.farmSize || 2.5} acres
- State / Agro-Climatic Zone: ${userProfile.state || 'India'}, ${userProfile.location || ''}`
    : 'Smallholder farmer context';

  const systemInstruction = `You are AgriX Agronomy AI, an educational assistant grounded in verified sustainable agronomy principles (ICAR / State Agricultural Universities).
Rules:
1. Provide practical, farmer-accessible educational guidance.
2. Ground all advice strictly in the provided practice record and verified agronomic science.
3. NEVER prescribe specific chemical pesticide quantities, synthetic fertilizer dosages, or speculative percentage yield increases.
4. Always advise personal protective equipment, adherence to certified manufacturer labels, and consultation with local Krishi Vigyan Kendra (KVK) officers.
5. Highlight soil health, water conservation, and biodiversity.`;

  const prompt = `Please provide an educational agronomic explanation for the verified sustainable practice:
Title: ${practice.title}
Category: ${practice.category}
Standard Description: ${practice.description}
Standard Benefits: ${practice.sustainabilityBenefit}
Verified Source: ${practice.sourceCitation}
Farmer Profile:
${profileContext}

Return a structured JSON object with the following schema:
{
  "overview": "Clear working principle in farmer-accessible language (max 300 characters)",
  "whyForFarmer": "Why this specifically suits this farmer's crop and soil conditions",
  "stepByStepGuidance": ["Step 1...", "Step 2...", "Step 3..."],
  "requiredMaterials": ["Material 1...", "Material 2..."],
  "precautions": ["Precaution 1...", "Precaution 2..."],
  "expectedBenefits": ["Benefit 1...", "Benefit 2..."]
}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const response: any = await Promise.race([generatePromise, timeoutPromise]);
    const rawText = (response.text || '').trim();

    let parsed: any = {};
    try {
      let cleaned = rawText;
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      parsed = JSON.parse(cleaned.trim());
    } catch {
      parsed = { overview: rawText.slice(0, 400).trim() };
    }

    return validateAndSanitizeExplanation(
      parsed,
      practice,
      userProfile,
      'gemini'
    );
  } catch (err: any) {
    console.warn('Gemini explainPractice fallback activated:', err?.message || err);
    return validateAndSanitizeExplanation(
      {
        overview: practice.description,
        whyForFarmer: `Recommended for ${userProfile?.mainCrop || 'your main crop'} on ${userProfile?.soilType || 'your soil'} under ${userProfile?.farmingMethod || 'sustainable'} practices. ${practice.whyRecommended || practice.sustainabilityBenefit}`,
        stepByStepGuidance: practice.steps,
        requiredMaterials: practice.requiredMaterials,
        precautions: practice.precautions,
        expectedBenefits: practice.expectedBenefits,
      },
      practice,
      userProfile,
      'rule_fallback'
    );
  }
}

export async function askAgriXAssistant(
  prompt: string,
  userProfile?: Partial<User>,
  chatHistory: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<{ reply: string; disclaimer: string; source: 'gemini' | 'rule_fallback'; isAIGenerated: boolean }> {
  const profileContext = userProfile
    ? `User Farmer Context:
- Main Crop: ${userProfile.mainCrop || 'Mixed'}
- Soil Type: ${userProfile.soilType || 'Loamy'}
- Farming Method: ${userProfile.farmingMethod || 'Mixed'}
- Farm Size: ${userProfile.farmSize || 3} acres
- Location: ${userProfile.location || 'Rural'}, ${userProfile.state || 'India'}
- Experience Level: ${userProfile.experienceLevel || 'Intermediate'}`
    : 'No farmer profile specified. Assume smallholder sustainable agriculture in India.';

  const systemInstruction = `You are AgriX AI Assistant, an educational sustainable farming advisor.
Your mission is to help farmers understand and adopt agro-ecological practices (soil health, water conservation, biological pest management, agroforestry, and composting).

Safety & Accuracy Rules:
1. Speak in simple, practical, farmer-friendly language with clear bullet points.
2. Tailor advice to the farmer's specific crop, soil, and region when provided.
3. NEVER provide unsupported chemical pesticide quantities, synthetic fertilizer dosages, or speculative percentage yield claims.
4. Emphasize low-cost, natural, regenerative practices (mulching, certified botanical sprays, vermicomposting, micro-irrigation, bio-fertilizers).
5. Always remind the farmer to verify severe pest or disease outbreaks with their local Krishi Vigyan Kendra (KVK) or certified agricultural extension officer.
6. Connect practical steps to gamified challenges and badges on the AgriX platform.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const contents: any[] = [];
    contents.push({
      role: 'user',
      parts: [{ text: `Here is my farm profile:\n${profileContext}\n\nPlease tailor all advice to these conditions.` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: `Understood! I will tailor educational sustainable agronomy advice to your ${userProfile?.mainCrop || 'crop'} and ${userProfile?.soilType || 'soil'} conditions.` }],
    });

    for (const h of chatHistory.slice(-6)) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const response: any = await Promise.race([generatePromise, timeoutPromise]);
    const reply = response.text || 'I could not generate an answer right now. Please try asking again.';
    return {
      reply,
      disclaimer: DISCLAIMER_TEXT,
      source: 'gemini',
      isAIGenerated: true,
    };
  } catch (err: any) {
    console.warn('Gemini API call fallback:', err?.message || err);
    const fallbackReply = generateFallbackAdvice(prompt, userProfile);
    return {
      reply: fallbackReply,
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_fallback',
      isAIGenerated: false,
    };
  }
}

function generateFallbackAdvice(prompt: string, profile?: Partial<User>): string {
  const p = prompt.toLowerCase();
  const crop = profile?.mainCrop || 'crops';
  const soil = profile?.soilType || 'soil';

  if (p.includes('water') || p.includes('irrigation')) {
    return `### Sustainable Water Stewardship for ${crop}

Water stewardship is critical for preserving healthy ${soil} fields:

1. **Organic Mulching:**
   - Spread a layer of clean paddy straw or dried crop residues around the base of your ${crop}.
   - Buffers root-zone soil temperature, retards weed growth, and significantly curtails surface evaporation compared to bare soil.

2. **Drip Irrigation or Micro-Sprinklers:**
   - Deliver water directly into the crop root zone instead of flood irrigation.
   - Minimizes surface runoff and deep drainage losses while maintaining optimal root aeration.

3. **Irrigation Timing:**
   - Schedule irrigation during cooler morning or late afternoon hours to minimize evaporative losses.

4. **In-field Percolation Trenches:**
   - Establish shallow contour trenches or bund pits to capture seasonal rainfall runoff and recharge sub-surface groundwater.

*Tip: Complete the "Start Mulching Your Crop Rows" challenge on AgriX to earn points and progress your Water Saver badge!*`;
  }

  if (p.includes('pest') || p.includes('insect') || p.includes('spray')) {
    return `### Natural & Integrated Pest Management for ${crop}

Protect your ${crop} while preserving beneficial pollinators and natural predators:

1. **Botanical Formulations (e.g., Neem Seed Extract):**
   - Prepare botanical extracts strictly in accordance with certified product label instructions or local Krishi Vigyan Kendra (KVK) guidelines.
   - Always conduct a patch test on 1-2 sentinel plants before broad-field application.
   - Spray during late afternoon hours to safeguard foraging bees.

2. **Monitoring Sticky Traps:**
   - Install yellow sticky traps for sucking pests (whiteflies, aphids) and blue traps for thrips at canopy height.
   - Provides early detection before insect populations reach economic threshold levels.

3. **Ecological Border Plantings:**
   - Interplant marigolds, mustard, or coriander along field margins to attract predatory hoverflies and parasitic wasps.

*Tip: Check the AgriX challenge "Deploy Yellow & Blue Sticky Traps" to log your pest management activity!*`;
  }

  if (p.includes('soil') || p.includes('fertility') || p.includes('compost')) {
    return `### Enhancing Soil Health for ${soil}

Building biological organic matter is the foundation of regenerative agriculture:

1. **Cured Vermicompost Application:**
   - Incorporate well-cured compost or earthworm castings into the root zone according to your local soil test recommendations.
   - Supplies diverse microbial flora to improve soil nutrient exchange capacity.

2. **Green Manuring:**
   - Sow leguminous green manure crops (e.g., Sesbania/Dhaincha or Sunn hemp) prior to the primary cropping season.
   - Invert into the soil at the 50% flowering stage to recycle organic carbon and fixed nitrogen naturally.

3. **Bio-fertilizer Inoculation:**
   - Treat seeds or seedlings with certified microbial inoculants (Azotobacter, Rhizobium, or Phosphate Solubilizing Bacteria) as recommended by your state agricultural university.

4. **Conservation Tillage:**
   - Minimize excessive deep tillage to preserve beneficial mycorrhizal networks and aggregate structure.

*Tip: The AgriX "Establish a Vermicomposting Pit" challenge gives +90 points towards the 🌿 Soil Guardian badge!*`;
  }

  if (p.includes('crop rotation') || p.includes('rotation')) {
    return `### Principles of Agro-Ecological Crop Rotation

Crop rotation breaks pest life cycles and balances nutrient uptake across soil layers:

1. **Root Depth Diversification:**
   - Rotate deep-rooted taproot species with shallow fibrous-rooted crops to access distinct soil strata.

2. **Leguminous Replenishment:**
   - Follow heavy-feeding crops (${crop}) with pulses (e.g., green gram, pigeon pea, groundnut) to biologically enrich soil nitrogen.

3. **Botanical Family Rotation:**
   - Avoid sequential planting of crops from the same family (e.g., Solanaceae: tomato, brinjal, chili) in identical beds to curtail soil-borne wilt and nematode buildup.

*Tip: Share your crop rotation plan on the AgriX Community board to collaborate with regional farmers!*`;
  }

  return `### Sustainable Farming Stewardship for ${crop}

Sustainable farming balances soil biology, resource conservation, and ecological resilience:

1. **Soil Biological Health:** Build organic matter using compost, crop residues, and bio-fertilizer inoculants.
2. **Water Efficiency:** Adopt micro-irrigation and organic mulching to protect ${soil} moisture.
3. **Biodiversity & Biological Control:** Deploy floral border strips and monitoring traps to naturally buffer pest pressures.
4. **AgriX Roadmap:** Explore your personalized recommendations on AgriX. Submitting verified field evidence earns points, builds streaks, and unlocks badges!

Have a specific inquiry about irrigation schedules, biological pest controls, or organic composting? Ask away!`;
}

