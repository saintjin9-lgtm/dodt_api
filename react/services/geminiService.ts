import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiAnalysisResponse } from "../types";

// Helper to validate environment
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing from environment variables.");
    return "";
  }
  return key;
};

export const analyzeFashionImage = async (
  base64Image: string,
  userPrompt: string
): Promise<GeminiAnalysisResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Return mock data if no key for demo purposes to prevent crash
    return {
      analysis: "API Key missing. Mock analysis: The outfit features a balanced silhouette suitable for casual outings.",
      recommendation: "Try adding a statement accessory like a silver necklace or a colorful beanie to elevate the look.",
      tags: ["#MockData", "#OOTD", "#Casual", "#StreetStyle"]
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      analysis: {
        type: Type.STRING,
        description: "A professional fashion analysis of the uploaded image and user request.",
      },
      recommendation: {
        type: Type.STRING,
        description: "Specific styling advice or item recommendations.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Relevant fashion tags, mixing English and Korean (e.g., #OOTD, #Kwan-kku).",
      },
    },
    required: ["analysis", "recommendation", "tags"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `You are a world-class fashion stylist for the app 'DOTD'. 
            Analyze this user photo. User prompt: "${userPrompt}". 
            Provide a styling analysis, specific recommendations to improve the look, 
            and 5-7 trendy hashtags (including Korean terms like #Kwan-kku if fits).
            Tone: Trendy, helpful, encouraging.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiAnalysisResponse;
    }
    throw new Error("No text response from Gemini");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback in case of error
    return {
      analysis: "We couldn't analyze the image at this moment.",
      recommendation: "Please try uploading a clearer photo.",
      tags: ["#Error", "#Retry"]
    };
  }
};
