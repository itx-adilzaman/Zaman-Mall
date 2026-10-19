import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Product } from "../types";
import Constants from 'expo-constants';

// Use Expo Constants for API Key in mobile environment
const API_KEY = Constants.expoConfig?.extra?.API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.API_KEY || "";

/**
 * Gets a recommendation from Zaman AI based on user query and catalog.
 */
export const getShoppingAssistantResponse = async (query: string, products: Product[]) => {
  try {
    console.log("Zaman AI: Request received for query:", query);
    console.log("Zaman AI: Using API Key (first 5 chars):", API_KEY.substring(0, 5) + "...");

    if (!API_KEY) {
      console.warn("Zaman AI: Gemini API Key missing");
      return "Zaman AI node is currently undergoing maintenance. Please consult our catalog directly.";
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const productContext = products.map(p => `${p.name} (Rs. ${p.price}): ${p.description}`).join('\n');
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: `You are "Zaman AI", the official premium shopping assistant for "Zaman Sons Super Mall". 
        Here is our current catalog:
        ${productContext}
        
        Provide a concise, professional recommendation based on our catalog. If we don't have exactly what they want, suggest the closest match. Always maintain a high-end, helpful tone. Talk in Urdu/Hindi mixed with English as requested by Pakistani users.`,
    });

    console.log("Zaman AI: Calling Gemini API...");
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `User asks: "${query}"` }] }]
    }).catch((e: Error) => {
        console.error("Zaman AI: Gemini API call failed:", e.message);
        if (e.message.includes("404")) {
          console.log("Zaman AI: Model not found error. This usually means the API Key is not authorized for this specific model or version.");
        }
        return null;
    });
    
    if (!result) {
      return "Zaman AI node is currently undergoing maintenance. Please consult our catalog directly.";
    }

    const responseText = result.response.text();
    console.log("Zaman AI: Response received successfully");
    return responseText;
  } catch (error) {
    console.error("Zaman AI: Unexpected Error:", error);
    return "Zaman AI is temporarily resting. Please try again soon!";
  }
};

/**
 * Gets AI-driven product recommendations based on search context.
 */
export const getAiRecommendations = async (context: { search: string, filter: string }, products: Product[]): Promise<string[]> => {
  try {
    if (!API_KEY) return [];
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const productList = products.map(p => ({ id: p.id, name: p.name, category: p.category }));
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            recommendedIds: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ["recommendedIds"]
        }
      },
      systemInstruction: "You are an expert product recommender. Return the IDs of 3 products in JSON format.",
    });

    const response = await model.generateContent(`Analyze context: Search: "${context.search}", Category: "${context.filter}". List 3 product IDs from: ${JSON.stringify(productList)}`).catch(e => {
        console.warn("AI recommendation fetch failed", e);
        return null;
    });

    const jsonStr = response?.response?.text()?.trim() || "{}";
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
    if (!API_KEY) return "Precision-engineered for the modern lifestyle.";
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: "You are a professional luxury copywriter for Zaman Sons Super Mall. Keep descriptions under 50 words.",
    });

    const response = await model.generateContent(`Generate a sleek, luxury marketing description for a product named "${productName}".`).catch(e => {
        console.warn("Gemini description fetch failed", e);
        return null;
    });
    return response?.response?.text() || "Precision-engineered for the modern lifestyle.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI description.";
  }
};
