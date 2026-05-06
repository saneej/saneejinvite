import { Guest, WeddingSettings } from "../types";

export async function generatePersonalizedInvitation(
  guestName: string,
  category: string,
  tone: string,
  weddingDate: string,
  weddingLocation: string
) {
  try {
    const response = await fetch("/api/ai/generate-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName, category, tone, weddingDate, weddingLocation }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI Generation Failed");
    return data.text || "";
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
  try {
    const response = await fetch("/api/ai/suggest-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI Categorization Failed");
    return data || names.map(name => ({ name, category: "Uncategorized" }));
  } catch (error) {
    console.error("AI Categorization Error:", error);
    return names.map(name => ({ name, category: "Uncategorized" }));
  }
}

export async function extractGuestsFromImage(base64Data: string, mimeType: string) {
  try {
    const response = await fetch("/api/ai/extract-guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Data, mimeType }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI Extraction Failed");
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
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI Chat Failed");
    return data.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}
