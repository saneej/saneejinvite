import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    if (!apiKey) {
      console.error("AI ERROR: GEMINI_API_KEY is missing from environment.");
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function extractGuestsFromImage(base64Image: string, mimeType: string) {
  try {
    const ai = getAI();
    // Using gemini-3.1-flash-lite-preview for faster extraction as it's optimized for latency
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: "Extract all guest names from this screenshot. This is likely a WhatsApp group member list, a contact list, or a printed guest list. Return only a valid JSON array of strings containing the full names.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      },
    });

    const text = response.text;
    if (!text) return [];
    
    try {
      return JSON.parse(text) as string[];
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", text);
      return [];
    }
  } catch (error) {
    console.error("AI Extraction Error:", error);
    if (error instanceof Error && error.message.includes("403") || error.message.includes("API key")) {
      throw new Error("AI API Key error. Please check your GEMINI_API_KEY in the Secrets panel.");
    }
    throw new Error("Failed to extract names from image. Please try a clearer screenshot.");
  }
}

export async function generatePersonalizedInvitation(
  guestName: string,
  category: string,
  tone: string,
  weddingDate: string,
  venue: string
) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Still use flash-preview for quality, but set low thinking
      contents: `
        Write a short, heart-warming wedding invitation message for a guest named "${guestName}".
        The guest is in the "${category}" category (e.g., Family, Friend, Colleage).
        The wedding is on ${weddingDate} at ${venue}.
        
        Your tone should be: ${tone}
        
        Keep the message concise (suitable for WhatsApp). 
        Include the date and venue clearly.
        The message should feel personal to their relationship/category.
        Do not use placeholders, write the final text.
        Return ONLY the message text.
      `,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("AI Personalization Error:", error);
    throw error;
  }
}
