import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { ExcelSchema } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const excelSchema: SchemaParams = {
  type: Type.OBJECT,
  properties: {
    filename: { type: Type.STRING, description: "The name of the file (e.g., Budget_Dashboard.xlsx)" },
    summary: { type: Type.STRING, description: "A brief explanation in Sinhala." },
    sheets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the worksheet" },
          type: { 
            type: Type.STRING, 
            enum: ["data", "dashboard"],
            description: "Use 'dashboard' for the main overview sheet, 'data' for raw input sheets."
          },
          mergeCells: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of cell ranges to merge for layout (e.g., 'A1:E1' for title, 'A3:B5' for a KPI card)."
          },
          columns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                header: { type: Type.STRING },
                key: { type: Type.STRING },
                width: { type: Type.NUMBER }
              },
              required: ["header", "key"]
            }
          },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            description: "2D array. For 'dashboard', use FORMULAS starting with '=' to reference data sheets (e.g., '=SUM(Income!C:C)')."
          }
        },
        required: ["name", "columns", "data", "type"]
      }
    }
  },
  required: ["filename", "sheets", "summary"]
};

export const generateExcelStructure = async (userPrompt: string): Promise<ExcelSchema> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: `
          You are a world-class Excel Architect. Your goal is to build "Supiri" (Superior/Professional) Excel files based on Sinhala or English requests.
          
          **CRITICAL INSTRUCTIONS FOR DASHBOARDS:**
          1. **Structure:** If the user asks for a dashboard/summary, create a 'dashboard' sheet FIRST. Then create 'data' sheets (e.g., 'Income', 'Expenses').
          2. **Formulas:** The Dashboard MUST be dynamic. Use formulas starting with '='.
             - Example: If you have an 'Expenses' sheet with amounts in Column C, the Dashboard should have a cell with "=SUM(Expenses!C:C)".
             - Do not put static numbers in the dashboard if they can be calculated.
          3. **Layout (Shapes/Cards):** 
             - Use 'mergeCells' to create large "KPI Cards" or "Blocks" on the dashboard. 
             - Example: Merge "B3:D5" to create a large box for "Total Income".
             - Leave empty rows/columns as spacing between blocks to make it look professional.
          4. **Data Sheets:** Include 10+ rows of realistic mock data for Sri Lankan context (LKR, Colombo, local names).
          
          **Example Scenario:**
          User: "Income expense dashboard."
          Output:
          - Sheet 1 (Dashboard): 
            - Merge A1:F1 (Title "Financial Overview").
            - Merge A3:C5 (Total Income Box). Cell A3 value: "Total Income". Cell A4 value: "=SUM(Income!B:B)".
            - Merge D3:F5 (Total Expense Box).
          - Sheet 2 (Income): Date, Description, Amount.
          - Sheet 3 (Expenses): Date, Category, Amount.
        `,
        responseMimeType: "application/json",
        responseSchema: excelSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(response.text) as ExcelSchema;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate Excel structure. Please try again.");
  }
};
