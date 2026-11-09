import { GoogleGenAI } from '@google/genai';
import { User } from '../db/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const DISCLAIMER_TEXT =
  '⚠️ Note: AgriX AI Assistant provides educational guidance based on sustainable agronomy principles. This is an experimental prototype. For critical pest outbreaks, chemical dosages, or commercial investments, please verify recommendations with your local agricultural extension officer or Krishi Vigyan Kendra (KVK).';

export async function askAgriXAssistant(
  prompt: string,
  userProfile?: Partial<User>,
  chatHistory: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<{ reply: string; disclaimer: string; source: 'gemini' | 'rule_fallback' }> {
  const profileContext = userProfile
    ? `User Farmer Context:
- Name: ${userProfile.name || 'Farmer'}
- Main Crop: ${userProfile.mainCrop || 'Mixed'}
- Soil Type: ${userProfile.soilType || 'Loamy'}
- Farming Method: ${userProfile.farmingMethod || 'Mixed'}
- Farm Size: ${userProfile.farmSize || 3} acres
- Location: ${userProfile.location || 'Rural'}, ${userProfile.state || 'India'}
- Experience Level: ${userProfile.experienceLevel || 'Intermediate'}`
    : 'No farmer profile specified. Assume smallholder sustainable agriculture.';

  const systemInstruction = `You are AgriX AI Assistant, a friendly, encouraging, and highly knowledgeable sustainable farming educator.
Your mission is to help farmers understand and adopt sustainable agriculture practices (soil conservation, precision water management, organic biological pest control, agroforestry, composting, and farm biodiversity).

Rules:
1. Speak in simple, practical, farmer-friendly language with clear step-by-step points.
2. Tailor advice to the farmer's specific crop, soil, location, and farming method when provided.
3. Emphasize low-cost, natural, and regenerative farming alternatives (e.g. mulching, neem sprays, vermicompost, alternate wetting and drying, bio-fertilizers).
4. Never claim absolute certainty about yield outcomes. Do not pretend recommendations guarantee specific monetary profits.
5. Always advise safety: remind the farmer to verify severe pest or disease diagnosis with a certified local agricultural extension officer or university research station.
6. Keep answers structured with short headings, bullet points, and quick action steps.
7. Emphasize how these practices connect to challenges and badges on the AgriX platform!`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Build contents array
    const contents: any[] = [];
    contents.push({
      role: 'user',
      parts: [{ text: `Here is my farm profile:\n${profileContext}\n\nPlease keep this in mind for our discussion.` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: `Understood! I will tailor all sustainable farming advice to your ${userProfile?.mainCrop || 'crop'} and ${userProfile?.soilType || 'soil'} conditions.` }],
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
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const response: any = await Promise.race([generatePromise, timeoutPromise]);

    const reply = response.text || 'I could not generate an answer right now. Please try asking again.';
    return {
      reply,
      disclaimer: DISCLAIMER_TEXT,
      source: 'gemini',
    };
  } catch (err: any) {
    console.warn('Gemini API call fallback:', err?.message || err);
    // Realistic agricultural rule-based response when API key is unavailable or throttled
    const fallbackReply = generateFallbackAdvice(prompt, userProfile);
    return {
      reply: fallbackReply,
      disclaimer: DISCLAIMER_TEXT,
      source: 'rule_fallback',
    };
  }
}

function generateFallbackAdvice(prompt: string, profile?: Partial<User>): string {
  const p = prompt.toLowerCase();
  const crop = profile?.mainCrop || 'crops';
  const soil = profile?.soilType || 'soil';

  if (p.includes('water') || p.includes('irrigation')) {
    return `### Sustainable Water Management for ${crop}

Water stewardship is critical for healthy ${soil} fields. Here are practical ways to reduce water consumption:

1. **Organic Mulching:**
   - Spread a 3-inch layer of paddy straw or dry crop residues around the base of your ${crop}.
   - This keeps the soil cool and cuts surface evaporation by up to 35-40%.

2. **Drip Irrigation or Micro-Sprinklers:**
   - Deliver water directly into the root zone instead of flood irrigation.
   - Saves 40-60% water while maintaining optimal root aeration.

3. **Irrigation Timing:**
   - Water early in the morning before 8:30 AM or late in the afternoon after 4:30 PM to minimize evaporation loss.

4. **In-field Percolation Pits:**
   - Dig shallow contour trenches along the farm boundaries to trap rainwater runoff and recharge local sub-surface water.

*Tip: Complete the "Start Mulching Your Crop Rows" challenge on AgriX to earn +50 points!*`;
  }

  if (p.includes('pest') || p.includes('insect') || p.includes('spray')) {
    return `### Natural & Integrated Pest Management for ${crop}

To protect your ${crop} without destroying beneficial bees and ladybug beetles:

1. **Neem Seed Kernel Extract (NSKE 5%):**
   - Dilute 50ml cold-pressed neem oil with a drop of liquid soap in 10L clean water.
   - Spray during late afternoon hours. It repels sucking pests like aphids, thrips, and whiteflies without chemical residues.

2. **Sticky Traps:**
   - Hang yellow traps for whiteflies and aphids, and blue traps for thrips at canopy height.
   - Provides early detection before insect populations spike.

3. **Flowering Border Plants:**
   - Plant African marigolds and coriander around field edges to attract parasitic wasps and predatory hoverflies that eat caterpillars naturally.

*Tip: Check the AgriX challenge "Deploy Yellow & Blue Sticky Traps" to log your pest management activity and earn +40 points!*`;
  }

  if (p.includes('soil') || p.includes('fertility') || p.includes('compost')) {
    return `### Improving Soil Health for ${soil}

Building biological organic carbon is the foundation of high-resilience farming:

1. **Vermicompost Application:**
   - Apply well-cured earthworm castings (2-3 tons per acre or 250g per plant base).
   - Introduces billions of beneficial fungi and bacteria into your ${soil}.

2. **Green Manuring:**
   - Sow Sesbania (Dhaincha) or Sunn hemp before your main crop season.
   - Incorporate into the soil after 45 days when flowering begins to fix natural nitrogen.

3. **Bio-fertilizer Inoculation:**
   - Inoculate seeds or seedlings with Azotobacter/Rhizobium and Phosphobacteria (PSB) to mobilize locked-up soil phosphorus.

4. **Minimize Deep Inversion Tillage:**
   - Excessive plowing breaks soil aggregate structure and releases soil carbon into the air.

*Tip: The AgriX "Establish a Vermicomposting Pit" challenge gives +90 points and counts towards the 🌿 Soil Guardian badge!*`;
  }

  if (p.includes('crop rotation') || p.includes('rotation')) {
    return `### Principles of Effective Crop Rotation

Crop rotation breaks pest and disease cycles while balancing soil nutrient extraction:

1. **Alternate Deep & Shallow Rooters:**
   - Deep-rooted crops open subsoil channels, followed by shallow feeders like leafy vegetables.

2. **Always Include a Legume:**
   - Follow heavy-feeding cereals (${crop}) with pulses like green gram, cowpea, or groundnut to replenish nitrogen biologically.

3. **Disrupt Plant Families:**
   - Never plant solanaceous crops (Tomato, Eggplant, Chili) back-to-back in the same bed to prevent bacterial wilt and nematode build-up.

*Tip: Log your intercropping or rotational bed layout on the AgriX Community board to inspire other farmers!*`;
  }

  return `### Sustainable Farming Recommendation for ${crop}

Sustainable farming balances soil health, resource conservation, and ecological biodiversity:

1. **Soil Care First:** Focus on building organic matter through compost, farmyard manure, and crop residue recycling.
2. **Water Efficiency:** Adopt localized drip lines or mulching to preserve root-zone moisture in ${soil}.
3. **Biological Diversity:** Introduce border flowering strips, multi-cropping, and natural pest repellents (neem oil / panchagavya).
4. **AgriX Gamified Roadmap:** Check your AgriX Dashboard to see personalized challenges tailored for your farm profile. Every challenge you mark completed gives points, strengthens your streak, and unlocks badges!

Have a specific question about pest control, irrigation, or bio-fertilizers? Ask away!`;
}
