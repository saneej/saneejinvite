import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini with API Key from process.env (as per skill instructions)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function suggestGuestCategory(params: {
  guestName: string;
  notes: string;
  availableCategories: { name: string; id: string }[];
}) {
  const { guestName, notes, availableCategories } = params;
  
  if (!guestName) return null;

  const categoryNames = availableCategories.map(c => c.name).join(", ");
  
  const systemInstruction = `You are a professional wedding guest organizer. 
Your task is to analyze a guest's name and notes to suggest the most appropriate category from a provided list.

Available Categories: ${categoryNames}

Guidelines:
1. Only return one of the available categories.
2. If multiple categories seem possible, pick the most specific one.
3. If no category fits perfectly, pick the closest match.
4. "Groom's Family" or "Bride's Family" are common categories.
5. "Friends" or "Colleagues" are also common.
6. Look for keywords like "boss", "work", "cousin", "aunt", "college friend" in the notes.

Return your response in clean JSON format.`;

  const prompt = `Name: ${guestName}\nNotes: ${notes}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: {
              type: Type.STRING,
              description: "The name of the suggested category from the list.",
            },
            reasoning: {
              type: Type.STRING,
              description: "A very brief explanation of why this category was chosen.",
            },
          },
          required: ["suggestedCategory", "reasoning"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as { suggestedCategory: string; reasoning: string };
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return null;
  }
}
