
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

/**
 * Gets a recommendation from Zaman AI based on user query and catalog.
 */
export const getShoppingAssistantResponse = async (query: string, products: Product[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const productContext = products.map(p => `${p.name} (Rs. ${p.price}): ${p.description}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: `User asks: "${query}"` }] }],
      config: {
        systemInstruction: `You are "Zaman AI", the official premium shopping assistant for "Zaman Sons Super Mall". 
        Here is our current catalog:
        ${productContext}
        
        Provide a concise, professional recommendation based on our catalog. If we don't have exactly what they want, suggest the closest match. Always maintain a high-end, helpful tone.`,
      },
    }).catch(e => {
      console.warn("Gemini Fetch Failure:", e);
      return null;
    });

    return response?.text || "Zaman AI node is currently undergoing maintenance. Please consult our catalog directly.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Zaman AI is temporarily resting. Please try again soon!";
  }
};

/**
 * Gets AI-driven product recommendations based on search context.
 */
export const getAiRecommendations = async (context: { search: string, filter: string }, products: Product[]): Promise<string[]> => {
  try {
    if (!process.env.API_KEY) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const productList = products.map(p => ({ id: p.id, name: p.name, category: p.category }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: `Analyze context: Search: "${context.search}", Category: "${context.filter}". List 3 product IDs from: ${JSON.stringify(productList)}` }] }],
      config: {
        systemInstruction: "You are an expert product recommender. Return the IDs of 3 products in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["recommendedIds"]
        }
      }
    }).catch(e => {
      console.warn("AI recommendation fetch failed", e);
      return null;
    });

    const jsonStr = response?.text?.trim() || "{}";
    const result = JSON.parse(jsonStr);
    return result.recommendedIds || [];
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return [];
  }
};

/**
 * Generates a luxury product description using AI.
 */
export const generateProductDescription = async (productName: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: `Generate a sleek, luxury marketing description for a product named "${productName}".` }] }],
      config: {
        systemInstruction: "You are a professional luxury copywriter for Zaman Sons Super Mall. Keep descriptions under 50 words.",
      }
    }).catch(e => {
      console.warn("Gemini description fetch failed", e);
      return null;
    });
    return response?.text || "Precision-engineered for the modern lifestyle.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI description.";
  }
};

/**
 * Visual Analysis Result interface for comprehensive visual search
 */
export interface VisualAnalysisResult {
  detectedItem: string;
  category: string;
  keywords: string[];
  colors: string[];
  searchQuery: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Advanced image analyzer for Visual Search using Gemini Vision with catalog context.
 */
export const analyzeImageForVisualSearch = async (
  base64Image: string,
  mimeType: string,
  catalogCategories: string[] = [],
  catalogProductNames: string[] = []
): Promise<VisualAnalysisResult | null> => {
  const apiKey = process.env.API_KEY;
  console.log('[VisualSearch] API key present:', !!apiKey, '| image length:', base64Image?.length);

  if (!apiKey) {
    console.warn('[VisualSearch] No API key — set GEMINI_API_KEY in .env.local');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const categoryHint = catalogCategories.length > 0
      ? `Our store categories include: ${catalogCategories.join(', ')}.`
      : 'Store categories: Electronics, Audio, Accessories, Fashion, Watches, Bags, Footwear, Home, Appliances.';

    // Pass a sample of product names so AI uses store-matching terms
    const productHint = catalogProductNames.length > 0
      ? `\nSome real product names in our store (use similar words in your keywords): ${catalogProductNames.slice(0, 40).join(', ')}.`
      : '';

    const prompt = `You are a visual product search AI for an e-commerce store called Zaman Sons Super Mall.
${categoryHint}${productHint}

Look at the image and identify the MAIN product or item shown.

Reply with ONLY a raw JSON object. No markdown. No explanation. Just JSON like this example:
{"detectedItem":"Analog Wristwatch","category":"Watches","keywords":["watch","wristwatch","analog","timepiece","leather","strap","luxury","men","silver","dial","quartz","classic"],"colors":["silver","brown","black"],"searchQuery":"analog wristwatch","confidence":"high"}

Rules:
- detectedItem: very specific product name (e.g. "Analog Wristwatch", "Running Shoes", "Wireless Earbuds") — NEVER use generic words like "item", "object", "product", "accessory"
- category: pick the single best matching store category from the list provided
- keywords: AT LEAST 10 to 14 lowercase search terms. Include ALL of: exact product type words, synonyms (e.g. watch=timepiece=wristwatch), material, style, gender target, use case, brand-style words, AND words that likely appear in actual store product names shown above
- colors: 1-4 main colors clearly visible in the image
- searchQuery: the best 2-4 word phrase a shopper would type to find this exact product
- confidence: high/medium/low based on how clearly the product is visible`;

    console.log('[VisualSearch] Calling Gemini API...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: (mimeType && mimeType.startsWith('image/')) ? mimeType : 'image/jpeg',
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
      // NOTE: Do NOT set responseMimeType:'application/json' with multimodal — it conflicts
    });

    const rawText = response?.text?.trim();
    console.log('[VisualSearch] Raw Gemini response:', rawText?.slice(0, 300));

    if (!rawText) {
      console.warn('[VisualSearch] Empty response from Gemini');
      return null;
    }

    // Extract JSON from the response — handles markdown fences, extra text, etc.
    let jsonText = rawText;

    // Strip ```json ... ``` or ``` ... ``` fences
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      jsonText = fenceMatch[1];
    } else {
      // Try to extract a JSON object directly
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch (parseErr) {
      console.error('[VisualSearch] JSON parse failed. Cleaned text was:', jsonText);
      return null;
    }

    console.log('[VisualSearch] ✅ Parsed result:', parsed);

    return {
      detectedItem: parsed.detectedItem || parsed.detected_item || 'Product',
      category: parsed.category || 'All',
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map((k: any) => String(k).toLowerCase().trim()).filter(Boolean)
        : [],
      colors: Array.isArray(parsed.colors)
        ? parsed.colors.map((c: any) => String(c).toLowerCase().trim()).filter(Boolean)
        : [],
      searchQuery: parsed.searchQuery || parsed.search_query || parsed.detectedItem || '',
      confidence: (['high', 'medium', 'low'] as const).includes(parsed.confidence)
        ? parsed.confidence
        : 'medium',
    };
  } catch (error: any) {
    console.error('[VisualSearch] ❌ API error:', error?.message || error);
    return null;
  }
};



/**
 * Identifies what a product is from an uploaded image using Gemini Vision,
 * then returns a short search query to find similar products in the catalog.
 */
export const identifyImageProduct = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const analysis = await analyzeImageForVisualSearch(base64Image, mimeType);
    if (analysis && analysis.searchQuery) {
      return analysis.searchQuery.toLowerCase();
    }

    if (!process.env.API_KEY) return "";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: `Look at this image and identify the main product or object shown. 
Return ONLY a short 1-3 word product search query (e.g. "wireless earbuds", "running shoes", "face cream"). 
No explanation, no punctuation, just the search term.`,
            },
          ],
        },
      ],
    }).catch(e => {
      console.warn("Gemini Vision fetch failed", e);
      return null;
    });

    return response?.text?.trim().toLowerCase() || "";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "";
  }
};



/**
 * Advanced Search Result returned per product
 */
export interface AdvancedSearchResult {
  productId: string;
  relevanceScore: number;   // 0–100
  matchReason: string;      // short human-readable reason
}

/**
 * AI-powered advanced search — interprets the query semantically, expands synonyms,
 * and returns ranked product IDs with relevance scores and match reasons.
 *
 * Falls back gracefully to client-side scoring if the API call fails.
 */
export const getAdvancedSearchResults = async (
  query: string,
  products: Product[]
): Promise<AdvancedSearchResult[]> => {
  if (!query.trim() || !products.length) return [];

  // ── Client-side fast scoring (always run first as baseline) ──────────
  const q = query.toLowerCase().trim();
  const clientScored = products
    .map(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat  = (p.category  || '').toLowerCase();
      let score = 0;
      let reason = '';

      if (name === q)                           { score = 100; reason = 'Exact match'; }
      else if (name.startsWith(q))              { score = 88;  reason = 'Name starts with query'; }
      else if (name.includes(q))               { score = 75;  reason = 'Name contains query'; }
      else if (cat.includes(q))                { score = 60;  reason = `Category: ${p.category}`; }
      else if (desc.includes(q))               { score = 45;  reason = 'Matches description'; }

      // Partial word matching
      if (score === 0) {
        const words = q.split(/\s+/).filter(w => w.length > 2);
        let hits = 0;
        for (const w of words) {
          if (name.includes(w) || desc.includes(w) || cat.includes(w)) hits++;
        }
        if (hits > 0) {
          score = Math.min(40, hits * 15);
          reason = `Partial match (${hits} keyword${hits > 1 ? 's' : ''})`;
        }
      }

      return { productId: p.id, relevanceScore: score, matchReason: reason };
    })
    .filter(r => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // ── Gemini semantic layer ─────────────────────────────────────────────
  const apiKey = process.env.API_KEY;
  if (!apiKey) return clientScored;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Send only id+name+category to keep the prompt compact
    const catalog = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: (p.description || '').slice(0, 120),
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [{
          text: `You are a smart product search engine for "Zaman Sons Super Mall" — a Pakistani e-commerce store.

User searched for: "${query}"

Product catalog (JSON):
${JSON.stringify(catalog)}

Your job: understand the user's intent semantically — including synonyms, related products, Urdu/English mixed queries, and common misspellings — then rank the most relevant products.

Return ONLY a raw JSON array. No markdown, no explanation. Max 10 items. Example:
[{"productId":"abc123","relevanceScore":92,"matchReason":"Exact product type"},{"productId":"xyz456","relevanceScore":78,"matchReason":"Related accessory"}]

Rules:
- relevanceScore: 0–100 (100 = perfect match)
- matchReason: ≤ 6 words explaining why this product matches
- Only include products with relevanceScore > 20
- Think about synonyms: e.g. "ghari" = watch, "joote" = shoes, "mobile" = phone, "kapray" = clothes
- Think about related items: searching "watch" should also surface watch straps, watch boxes
- Think about category: "electronics" should return all electronic products`
        }]
      }],
    }).catch(e => {
      console.warn('[AdvancedSearch] Gemini call failed:', e?.message);
      return null;
    });

    const rawText = response?.text?.trim();
    if (!rawText) return clientScored;

    // Strip markdown fences if present
    let jsonText = rawText;
    const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fence) jsonText = fence[1];
    else {
      const arr = rawText.match(/\[[\s\S]*\]/);
      if (arr) jsonText = arr[0];
    }

    const parsed: AdvancedSearchResult[] = JSON.parse(jsonText.trim());
    if (!Array.isArray(parsed)) return clientScored;

    // Merge: AI scores take priority, fill in any client-scored products AI missed
    const aiIds = new Set(parsed.map(r => r.productId));
    const merged = [
      ...parsed.map(r => ({
        productId: r.productId,
        relevanceScore: Math.min(100, Math.max(0, Number(r.relevanceScore) || 0)),
        matchReason: String(r.matchReason || '').trim(),
      })),
      ...clientScored.filter(r => !aiIds.has(r.productId) && r.relevanceScore >= 45),
    ].sort((a, b) => b.relevanceScore - a.relevanceScore);

    return merged.slice(0, 12);
  } catch (err) {
    console.warn('[AdvancedSearch] Falling back to client scoring:', err);
    return clientScored;
  }
};
