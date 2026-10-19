import { GoogleGenAI } from '@google/genai';

export const generateProductDescription = async (productName: string): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) return 'Premium quality product crafted for the modern lifestyle.';

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: `Generate a sleek, luxury marketing description for a product named "${productName}".` }] }],
      config: {
        systemInstruction:
          'You are a professional luxury copywriter for Zaman Sons Super Mall. Keep descriptions under 50 words.',
      },
    });
    return response?.text || 'Precision-engineered for the modern lifestyle.';
  } catch {
    return 'Premium quality product crafted for the modern lifestyle.';
  }
};
