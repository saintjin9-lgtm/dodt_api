import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerationParams, TrendInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a fashion image based on user parameters.
 */
export const generateFashionImage = async (params: GenerationParams): Promise<{ imageUrl: string; rawText?: string }> => {
  const { gender, height, bodyType, style, colors, prompt, userImage } = params;

  const colorString = colors.join(", ");
  const basePrompt = `
    Generate a photorealistic, high-quality full-body fashion look.
    Model details: ${gender}, ${height}cm, ${bodyType} build.
    Fashion Style: ${style}.
    Key Colors: ${colorString}.
    Specific Request: ${prompt || "Trendy and stylish outfit matching the description."}
    
    Ensure the lighting is professional fashion photography. 
    The background should be minimal or complementary to the outfit.
  `;

  // We use gemini-2.5-flash-image for general generation as per guidelines
  const model = 'gemini-2.5-flash-image';
  
  const parts: any[] = [{ text: basePrompt }];

  // If user provided an image (base64), we add it for reference (editing/inspiration)
  if (userImage) {
    // Remove header if present
    const cleanBase64 = userImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    parts.unshift({
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from string
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        // imageConfig for aspect ratio if supported, otherwise prompt handles it
      }
    });

    let imageUrl = '';
    let rawText = '';

    // Iterate to find image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          rawText += part.text;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image generated.");
    }

    return { imageUrl, rawText };

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

/**
 * Generates text insight about the fashion trend.
 */
export const generateTrendInsight = async (params: GenerationParams): Promise<TrendInsight> => {
  const { style, colors } = params;
  
  const prompt = `
    Analyze the current fashion trends for the style: "${style}" with colors: "${colors.join(', ')}".
    Provide a concise trend insight (approx 150 words) explaining why this combination works, 
    what items match (Outer, Inner, Bottoms, Shoes), and the impression it gives.
    Also provide 5 relevant hashtags.
    
    Return the result in JSON format with keys: "title" (short headline), "content" (the analysis), "tags" (array of strings).
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");

    return JSON.parse(text) as TrendInsight;

  } catch (error) {
    console.error("Gemini Insight Error:", error);
    // Fallback if JSON parsing fails or API errors
    return {
      title: "2024 F/W Trend Report",
      content: `The combination of ${style} with ${colors.join(', ')} creates a sophisticated look. Focus on textures and layering to enhance the ${style} vibe. Recommended items include structured jackets and minimal accessories.`,
      tags: ["#Fashion", `#${style}`, "#OOTD", "#Trending", "#Style"]
    };
  }
};