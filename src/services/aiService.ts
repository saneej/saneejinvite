import { Guest, WeddingSettings } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generatePersonalizedInvitation(
  guestName: string,
  category: string,
  tone: string,
  weddingDate: string,
  weddingLocation: string
) {
  try {
    const prompt = `Write a wedding invitation message for ${guestName} (${category}). 
Wedding Date: ${weddingDate}
Venue: ${weddingLocation}
Tone: ${tone}

Keep it elegant, warm, and personal. Use the tone requested.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export const generateInvitationMessage = async (params: {
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingLocation: string;
  guestName: string;
  category: string;
  tone: string;
}) => {
  return generatePersonalizedInvitation(
    params.guestName,
    params.category,
    params.tone,
    params.weddingDate,
    params.weddingLocation
  );
};

export async function suggestCategories(names: string[], availableCategories: string[]) {
  try {
    const prompt = `Suggest categories for these guests: ${names.join(', ')}.
Available categories: ${availableCategories.join(', ')}.
Return a JSON array of objects with {name, category}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["name", "category"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return data;
  } catch (error) {
    console.error("AI Categorization Error:", error);
    return names.map(name => ({ name, category: availableCategories[0] || "Uncategorized" }));
  }
}

export async function extractGuestsFromImage(base64Data: string, mimeType: string) {
  try {
    const prompt = "Extract all guest names from this image. Return a JSON array of strings containing only the names.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
}

export async function chatWithAI(params: {
  query: string;
  guests: Guest[];
  settings: WeddingSettings;
  history?: { role: 'user' | 'model'; text: string }[];
}) {
  const { query, guests, settings, history } = params;

  const contextPrompt = `You are a helpful wedding planning assistant. 
Current Wedding Details:
- Couple: ${settings.brideName} & ${settings.groomName}
- Date: ${settings.weddingDate}
- Venue: ${settings.venue}

Guest List Overview:
- Total Guests: ${guests.length}

Guest Data:
${guests.map((g: { name: string; category: string; status: string }) => `- ${g.name} (${g.category}): Status: ${g.status}`).join('\n')}

Using this data, answer the user's question or help them with their wedding planning.`;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: contextPrompt,
      },
      history: (history || []).map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage({ message: query });
    return result.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}
