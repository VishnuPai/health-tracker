import type { UserProfile, LabReport, Diet } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GOOGLE_GEN_AI_KEY;

// Debug Log (Do not log the full key in production!)
console.log(`[GeminiDebug] API Key Status: ${API_KEY ? 'Present (' + API_KEY.slice(0, 4) + '...)' : 'MISSING'}`);

export interface AIAnalysisResult {
    analysis: string;
    caloricRecommendation?: number;
    foodsToEat: string[];
    foodsToAvoid: string[];
}

const getErrorModelName = (error: any) => {
    if (error.message) return error.message;
    return '';
};

// Helper to robustly parse JSON from AI response
const cleanAndParseJSON = (text: string): any => {
    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // 2. Try extracting JSON block
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON block:", e2);
            }
        }
        throw new Error(`Failed to parse AI response as JSON. Raw text: ${text.slice(0, 100)}...`);
    }
};

export const generateDietaryAnalysis = async (
    profile: UserProfile | null,
    labReports: LabReport[],
    dietHistory: Diet[]
): Promise<AIAnalysisResult> => {
    if (!API_KEY) {
        throw new Error("System API Key is missing. Please check configuration.");
    }

    if (!profile) {
        throw new Error("User profile is missing");
    }

    const latestLabs = labReports
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
        .map(r => `${r.date}: ${r.results.map(res => `${res.testName}: ${res.value} ${res.unit} (Ref: ${res.minRange}-${res.maxRange})`).join(', ')}`)
        .join('\n');

    const dietLog = dietHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(d => `${d.date} (${d.mealType}): ${d.items} (~${d.caloriesApprox} kcal)`)
        .join('\n');

    const prompt = `
    Analyze the following health profile and lab data to provide dietary recommendations.
    
    User Profile:
    - Age: ${profile.age}
    - Gender: ${profile.gender}
    - Height: ${profile.height}cm
    - Weight: ${profile.weight}kg
    - Goal: ${profile.goal}
    - Activity: ${profile.activityLevel}

    Recent Lab Reports:
    ${latestLabs}

    Recent Diet Log:
    ${dietLog}

    Task:
    Provide a detailed dietary analysis.
    1. Identify any potential nutritional deficiencies or excesses based on labs.
    2. Review recent meals and suggest improvements.
    3. Recommend specific foods to eat and avoid.
    4. Provide a daily calorie target tailored to their goal.

    Response Format (JSON only):
    {
        "analysis": "Markdown formatted detailed analysis...",
        "caloricRecommendation": 2000,
        "foodsToEat": ["List", "of", "foods"],
        "foodsToAvoid": ["List", "of", "foods"]
    }
    `;

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using specific model version for stability (Gemini 2.0 Flash)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" } // Force JSON
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            throw new Error('Empty response from AI');
        }

        return cleanAndParseJSON(text);

    } catch (error: any) {
        console.error("AI Generation Error Details:", error);

        let fallbackErrorMsg = '';

        // Attempt fallback to 2.0 Flash Lite if Flash fails
        if ((error.message.includes('404') || error.message.includes('not found')) && !getErrorModelName(error).includes('gemini-2.0-flash-lite')) {
            console.log("Attempting fallback to gemini-2.0-flash-lite...");
            try {
                const genAI = new GoogleGenerativeAI(API_KEY);
                const fallbackModel = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash-lite",
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await fallbackModel.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                if (text) {
                    return cleanAndParseJSON(text);
                }
            } catch (fallbackError: any) {
                console.error("Fallback Error:", fallbackError);
                fallbackErrorMsg = "Fallback (gemini-pro) also failed: " + fallbackError.message;
            }
        }

        let msg = error.message || "Failed to generate AI insights";
        if (msg.includes('404') || msg.includes('not found')) {
            msg = "Model not found or API Key invalid. 1) Ensure 'Generative Language API' is enabled. 2) Check if your API Key is for 'Google AI Studio' (not Vertex AI).";
        } else if (msg.includes('400')) {
            msg = "Bad Request. Your API key might be invalid or restrictions are blocking this request.";
        } else if (msg.includes('429')) {
            msg = "System is busy (Rate Limit). Please try again later.";
        }

        if (fallbackErrorMsg) {
            msg += " | " + fallbackErrorMsg;
        }

        throw new Error(msg);
    }
};



export interface ScannedFoodResult {
    items: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealTypeEstimate: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export const analyzeFoodImage = async (
    base64Data: string,
    mimeType: string
): Promise<ScannedFoodResult> => {
    if (!API_KEY) throw new Error("System API Key is missing");

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Use gemini-2.0-flash for vision capabilities
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    Analyze this food image. Identify the items and estimate the total nutritional content.
    
    Return ONLY a JSON object with this format:
    {
        "items": "Short description of food items (e.g. Grilled Chicken Salad with Dressing)",
        "calories": 0, // Total estimated calories (integer)
        "protein": 0, // Total protein in grams (integer)
        "carbs": 0, // Total carbs in grams (integer)
        "fat": 0, // Total known fat in grams (integer)
        "mealTypeEstimate": "Lunch" // One of: Breakfast, Lunch, Dinner, Snack
    }
    `;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        return cleanAndParseJSON(text);

    } catch (error: any) {
        console.error("Vision Analysis Error:", error);

        // Fallback for 404s to another vision capable model if needed, but 2.0-flash is best for this.
        let msg = error.message || "Failed to analyze image";
        if (msg.includes('404')) {
            msg = "Vision model not found. Ensure your API Key supports Gemini 2.0 Flash.";
        }
        throw new Error(msg);
    }
};

export const generateLabReportAnalysis = async (
    report: LabReport
): Promise<AIAnalysisResult> => {
    if (!API_KEY) throw new Error("System API Key is missing");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const resultsText = report.results
        .map(r => `${r.testName}: ${r.value} ${r.unit} (Ref: ${r.minRange}-${r.maxRange})`)
        .join('\n');

    const prompt = `
    Analyze the following lab report results and provide specific dietary recommendations to improve abnormal values.
    
    Lab Report Date: ${report.date}
    ${resultsText}

    Task:
    1. Identify abnormal results (High/Low).
    2. Explain what these abnormalities might mean (briefly).
    3. Suggest specific foods to eat to improve these biomarkers.
    4. Suggest specific foods to avoid.

    Response Format (JSON only):
    {
        "analysis": "Markdown formatted analysis focusing on the abnormal results...",
        "foodsToEat": ["Specific food 1", "Specific food 2"],
        "foodsToAvoid": ["Specific food 1", "Specific food 2"]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return cleanAndParseJSON(text);
    } catch (error: any) {
        console.error("Lab Analysis Error:", error);
        throw new Error(error.message || "Failed to analyze lab report");
    }
};
