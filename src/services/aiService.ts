import { GoogleGenAI } from "@google/genai";
import { Guest, WeddingSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generatePersonalizedInvitation(
  guestName: string,
  category: string,
  tone: string,
  weddingDate: string,
  weddingLocation: string
) {
  const prompt = `Write a wedding invitation message for a guest.
Context:
- Guest Name: ${guestName}
- Relation/Category: ${category}
- Couple: [Couple Names] (Include placeholders if not provided)
- Date: ${weddingDate}
- Venue: ${weddingLocation}
- Requested Tone: ${tone}

Please write a personalized, warm message that can be sent via WhatsApp.
Output ONLY the message text.`;

  try {
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

export async function suggestCategories(names: string[]) {
  const prompt = `Given this list of wedding guests, suggest a short category name for each (e.g., "Groom's Family", "Bride's Friends", "Work Colleagues").
Names:
${names.join('\n')}

Format your response as a JSON array of objects: [{"name": "Name", "category": "Suggested Category"}].
Use common sense groups. If you can't tell, use "General Guests".
Return ONLY the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Categorization Error:", error);
    return names.map(name => ({ name, category: "Uncategorized" }));
  }
}

export async function extractGuestsFromImage(base64Data: string, mimeType: string) {
  const prompt = `Extract all individual names from this image of a guest list or WhatsApp group members.
Format your response as a simple JSON array of strings: ["Name 1", "Name 2", ...].
Exclude common words like 'Admin', 'Joined', 'Left', or dates and timestamps.
Return ONLY the JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const names = JSON.parse(response.text || "[]");
    return Array.isArray(names) ? names : [];
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
}

export async function chatWithAI(params: {
  query: string;
  guests: Guest[];
  settings: WeddingSettings;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
}) {
  const { query, guests, settings, history = [] } = params;

  const contextPrompt = `You are a helpful wedding planning assistant. 
Current Wedding Details:
- Couple: ${settings.brideName} & ${settings.groomName}
- Date: ${settings.weddingDate}
- Venue: ${settings.venue}

Guest List Overview:
- Total Guests: ${guests.length}
- Invited: ${guests.filter(g => g.status === 'INVITED').length}
- Not Invited: ${guests.filter(g => g.status === 'NOT_INVITED').length}
- WhatsApp Sent: ${guests.filter(g => g.status === 'WHATSAPP_SENT').length}
- RSVP Confirmed: ${guests.filter(g => g.status === 'RSVP_CONFIRMED').length}

Guest Data:
${guests.map(g => `- ${g.name} (${g.category}): Status: ${g.status}`).join('\n')}

Using this data, answer the user's question or help them with their wedding planning. 
If they ask for statistics, calculate them. If they ask for advice, be supportive and elegant.
Keep your response concise and helpful.`;

  try {
    const chat = ai.models.getChatSession({
      model: "gemini-3-flash-preview",
      history: [
        { role: 'user', parts: [{ text: contextPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I am ready to help you manage your wedding guest list and planning." }] },
        ...history
      ]
    });

    const result = await chat.sendMessage(query);
    return result.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}
