import { GoogleGenAI, Type } from "@google/genai";
import { Category, ExpenseDraft } from "../types";

// Lazy initialization to prevent runtime crashes during module load
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // Ensure API Key is available or handle gracefully
    const apiKey = process.env.API_KEY || ''; 
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const SYSTEM_PROMPT = `
You are an expert accountant and receipt analyzer. 
Analyze the provided image (receipt, screenshot of WeChat Pay/Alipay/Taobao, or handwritten note).
Extract the following information:
1. Date: The date of the transaction in YYYY-MM-DD format. If the year is missing, assume the current year. If no date is found, use today's date.
2. Item: A short, concise description of what was purchased (e.g., "Lunch", "Subway Ticket", "Uniqlo T-Shirt"). Max 4 words.
3. Amount: The total amount paid. Return as a number.
4. Category: Classify into one of these: Dining, Transport, Shopping, Groceries, Housing, Entertainment, Other.
`;

export const analyzeReceipt = async (base64Image: string): Promise<ExpenseDraft> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const client = getAiClient();

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: "Extract transaction details.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            item: { type: Type.STRING, description: "Short description of the expense" },
            amount: { type: Type.NUMBER, description: "Total numeric amount" },
            category: { 
              type: Type.STRING, 
              enum: [
                "Dining", "Transport", "Shopping", "Groceries", "Housing", "Entertainment", "Other"
              ] 
            },
          },
          required: ["date", "item", "amount", "category"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    // Validate and fallback
    return {
      date: data.date || new Date().toISOString().split('T')[0],
      item: data.item || "Unknown Item",
      amount: Number(data.amount) || 0,
      category: (data.category as Category) || Category.OTHER,
    };

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    // Fallback if AI fails completely
    return {
      date: new Date().toISOString().split('T')[0],
      item: "New Expense",
      amount: 0,
      category: Category.OTHER,
    };
  }
};