export interface Workout {
    id: string;
    date: string; // ISO Date string YYYY-MM-DD
    activity: string;
    durationMinutes: number;
    intensity: 'Low' | 'Medium' | 'High';
    caloriesBurned?: number;
    distance?: number; // in km
    pace?: number; // in min/km
    laps?: number; // for swimming
    notes?: string;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface Diet {
    id: string;
    date: string;
    mealType: MealType;
    items: string; // Comma separated items or description
    caloriesApprox: number;
    protein?: number; // in grams
    carbs?: number; // in grams
    fat?: number; // in grams
    healthRating: 1 | 2 | 3 | 4 | 5; // 1 (Bad) to 5 (Excellent)
}

export interface Sleep {
    id: string;
    date: string; // The date the sleep ended (morning of)
    durationHours: number;
    qualityScore: 1 | 2 | 3 | 4 | 5; // 1 (Poor) to 5 (Excellent)
}

export interface UserProfile {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    height: number; // in cm
    weight: number; // in kg
    goal: 'Lose Weight' | 'Maintain' | 'Gain Muscle';
    activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
}

export interface LabResult {
    id: string;
    testName: string;
    value: string | number;
    unit: string;
    minRange: number;
    maxRange: number;
    referenceRange?: string;
    category?: string;
}

export interface LabReport {
    id: string;
    date: string;
    title: string;
    results: LabResult[];
    pdfData?: string; // Base64 string of the PDF file (Deprecated in favor of pdfStorageId for large files)
    pdfStorageId?: string; // ID for IndexedDB storage
}
