import type { UserProfile, LabReport, LabResult } from '../types';

interface DietaryPlan {
    dailyCalories: number;
    macros: {
        protein: number; // grams
        carbs: number; // grams
        fat: number; // grams
    };
    recommendations: string[];
    recommendedFoods: string[];
    foodsToAvoid: string[];
}

export const getDietaryRecommendations = (profile: UserProfile | null, labReports: LabReport[]): DietaryPlan | null => {
    if (!profile) return null;

    // 1. Calculate BMR (Mifflin-St Jeor Equation)
    const weight = profile.weight || 70; // Default or return null?
    const height = profile.height || 170;
    const age = profile.age || 30;

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (profile.gender === 'male') bmr += 5;
    else bmr -= 161;

    // 2. Activity Multiplier
    const activityMultipliers: Record<string, number> = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    };
    const tdee = bmr * (activityMultipliers[profile.activityLevel || 'sedentary'] || 1.2);

    // 3. Goal Adjustment
    let targetCalories = tdee;
    if (profile.goal === 'lose_weight') targetCalories -= 500;
    else if (profile.goal === 'gain_muscle') targetCalories += 300;

    // Ensure calories don't drop too low safely
    if (targetCalories < 1200) targetCalories = 1200;

    // 4. Macronutrient Split (Simplified)
    // Protein: 2g per kg for muscle, 1.6g for loss, 0.8g for normal (we'll use a balanced approach)
    let proteinRatio = 0.25;
    let fatRatio = 0.25;
    let carbsRatio = 0.5;

    if (profile.goal === 'gain_muscle') {
        proteinRatio = 0.3;
        carbsRatio = 0.45;
        fatRatio = 0.25;
    } else if (profile.goal === 'lose_weight') {
        proteinRatio = 0.35;
        fatRatio = 0.3;
        carbsRatio = 0.35; // Lower carb for weight loss
    }

    const protein = Math.round((targetCalories * proteinRatio) / 4);
    const fat = Math.round((targetCalories * fatRatio) / 9);
    const carbs = Math.round((targetCalories * carbsRatio) / 4);

    const plan: DietaryPlan = {
        dailyCalories: Math.round(targetCalories),
        macros: { protein, carbs, fat },
        recommendations: [],
        recommendedFoods: [],
        foodsToAvoid: []
    };

    // 5. Basic Recommendations based on Goal
    if (profile.goal === 'lose_weight') {
        plan.recommendations.push("Focus on caloric deficit and high protein to retain muscle.");
        plan.recommendedFoods.push("Leafy greens", "Lean protein (chicken, tofu)", "Whole grains");
        plan.foodsToAvoid.push("Sugary drinks", "Processed snacks", "Deep fried foods");
    } else if (profile.goal === 'gain_muscle') {
        plan.recommendations.push("Ensure caloric surplus and sufficient protein intake.");
        plan.recommendedFoods.push("Eggs", "Quinoa", "Greek yogurt", "Nuts");
    } else {
        plan.recommendations.push("Maintain a balanced diet with a variety of foods.");
    }

    // 6. Lab-Based Recommendations
    // We scan latest results for specific markers
    const latestResults = new Map<string, LabResult>();
    labReports.forEach(report => {
        report.results.forEach(result => {
            latestResults.set(result.testName.toLowerCase(), result);
        });
    });

    // Helper to check if value is out of range
    const isHigh = (name: string): boolean => {
        const result = latestResults.get(name.toLowerCase());
        if (!result) return false;
        const val = Number(result.value);
        return !isNaN(val) && val > result.maxRange;
    };

    const isLow = (name: string): boolean => {
        const result = latestResults.get(name.toLowerCase());
        if (!result) return false;
        const val = Number(result.value);
        return !isNaN(val) && val < result.minRange;
    };

    // Cholesterol check
    if (isHigh('Total Cholesterol') || isHigh('LDL Cholesterol') || isHigh('Cholesterol')) {
        plan.recommendations.push("Your cholesterol levels are elevated. Prioritize heart-healthy fats and fiber.");
        plan.recommendedFoods.push("Oats", "Avocados", "Salmon (Fatty Fish)", "Olive Oil");
        plan.foodsToAvoid.push("Red meat", "Full-fat dairy", "Trans fats", "Butter");
    }

    // Glucose / Diabetes risk
    if (isHigh('Glucose') || isHigh('HbA1c') || isHigh('Blood Sugar')) {
        plan.recommendations.push("Blood sugar levels indicate a need for glycemic control.");
        plan.recommendedFoods.push("Non-starchy vegetables", "Legumes", "Whole oats", "Berries");
        plan.foodsToAvoid.push("White bread", "Soda", "Candy", "Fruit juice");
        // Adjust macros for lower carbs
        plan.macros.carbs = Math.round((plan.macros.carbs * 0.8)); // Reduce carbs by 20%
    }

    // Iron Deficiency
    if (isLow('Hemoglobin') || isLow('Iron') || isLow('Ferritin')) {
        plan.recommendations.push("Signs of possible anemia. Increase iron-rich foods.");
        plan.recommendedFoods.push("Spinach", "Red meat", "Lentils", "Fortified cereals");
        plan.recommendations.push("Consume Vitamin C with iron sources to improve absorption.");
    }

    // General deduction from basic results
    // De-duplicate lists
    plan.recommendedFoods = Array.from(new Set(plan.recommendedFoods));
    plan.foodsToAvoid = Array.from(new Set(plan.foodsToAvoid));

    return plan;
};
