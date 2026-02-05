import { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { getTodayString } from '../utils/date';
import { Plus, Trash2, Utensils, Pencil, Scale, Wheat, Beef, Droplet, Camera } from 'lucide-react';
import type { Diet, MealType } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { getDietaryRecommendations } from '../utils/recommendations';
import { generateDietaryAnalysis, type AIAnalysisResult } from '../services/gemini';
import { checkAndIncrementUsage } from '../services/db';
import { CONFIG } from '../config';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';


const DietPage = () => {
    // const { apiKey } = useHealth();
    const { dietEntries, addDietEntry, updateDietEntry, deleteDietEntry, user, userProfile } = useHealth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [mealType, setMealType] = useState<MealType>('Breakfast');
    const [items, setItems] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [rating, setRating] = useState<Diet['healthRating']>(3);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newEntryData = {
            date: editingId ? (dietEntries.find(d => d.id === editingId)?.date || getTodayString()) : getTodayString(),
            mealType,
            items,
            caloriesApprox: Number(calories),
            protein: protein ? Number(protein) : undefined,
            carbs: carbs ? Number(carbs) : undefined,
            fat: fat ? Number(fat) : undefined,
            healthRating: rating
        };

        if (editingId) {
            updateDietEntry({ ...newEntryData, id: editingId });
        } else {
            addDietEntry({ ...newEntryData, id: Date.now().toString() });
        }

        closeForm();
    };

    const handleEdit = (diet: Diet) => {
        setEditingId(diet.id);
        setMealType(diet.mealType);
        setItems(diet.items);
        setCalories(diet.caloriesApprox.toString());
        setProtein(diet.protein?.toString() || '');
        setCarbs(diet.carbs?.toString() || '');
        setFat(diet.fat?.toString() || '');
        setRating(diet.healthRating);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setMealType('Breakfast');
        setItems('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setRating(3);
    };

    const sortedDiet = [...dietEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate daily totals for today
    const today = getTodayString();
    const todayEntries = dietEntries.filter(d => d.date === today);
    const totalCalories = todayEntries.reduce((acc, curr) => acc + curr.caloriesApprox, 0);
    const totalProtein = todayEntries.reduce((acc, curr) => acc + (curr.protein || 0), 0);
    const totalCarbs = todayEntries.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
    const totalFat = todayEntries.reduce((acc, curr) => acc + (curr.fat || 0), 0);

    /*
    const handleScanComplete = (result: ScannedFoodResult) => {
        setItems(result.items);
        setCalories(result.calories.toString());
        setProtein(result.protein.toString());
        setCarbs(result.carbs.toString());
        setFat(result.fat.toString());
        setMealType(result.mealTypeEstimate);

        setIsScannerOpen(false);
        setIsFormOpen(true);
    };
    */

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>Diet</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your nutrition and meals</p>
                </div>
                <Button
                    onClick={() => {
                        if (isFormOpen) closeForm();
                        else setIsFormOpen(true);
                    }}
                    variant={isFormOpen ? 'secondary' : 'primary'}
                    icon={<Plus size={20} style={{ transform: isFormOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />}
                    style={{ marginRight: '0.5rem' }}
                >
                    {isFormOpen ? 'Cancel' : 'Log Meal'}
                </Button>
                <Button
                    onClick={() => setIsScannerOpen(!isScannerOpen)}
                    variant="outline"
                    icon={<Camera size={20} />}
                    style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                >
                    Scan Food
                </Button>
            </div>

            {/* Daily Summary */}
            {/* Daily Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Scale size={14} /> Calories</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{totalCalories} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kcal</span></span>
                </Card>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Beef size={14} /> Protein</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{totalProtein}g</span>
                </Card>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Wheat size={14} /> Carbs</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)' }}>{totalCarbs}g</span>
                </Card>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Droplet size={14} /> Fat</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{totalFat}g</span>
                </Card>
            </div>



            {isFormOpen && (
                <Card style={{ marginBottom: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        alignItems: 'end'
                    }}>
                        <Select
                            label="Meal Type"
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value as MealType)}
                            options={[
                                { value: 'Breakfast', label: 'Breakfast' },
                                { value: 'Lunch', label: 'Lunch' },
                                { value: 'Dinner', label: 'Dinner' },
                                { value: 'Snack', label: 'Snack' },
                            ]}
                        />
                        <Input
                            label="Food Items"
                            required
                            placeholder="e.g. Oatmeal, Banana"
                            value={items}
                            onChange={(e) => setItems(e.target.value)}
                        />
                        <Input
                            label="Calories"
                            required
                            type="number"
                            placeholder="400"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                        />

                        <div style={{ display: 'contents' }}>
                            <Input
                                label="Protein (g)"
                                type="number"
                                placeholder="0"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                            />
                            <Input
                                label="Carbs (g)"
                                type="number"
                                placeholder="0"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value)}
                            />
                            <Input
                                label="Fat (g)"
                                type="number"
                                placeholder="0"
                                value={fat}
                                onChange={(e) => setFat(e.target.value)}
                            />
                        </div>

                        <Input
                            label="Health Rating (1-5)"
                            required
                            type="number"
                            min={1}
                            max={5}
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value) as any)}
                        />

                        <Button
                            type="submit"
                            variant="success"
                            style={{ height: '46px' }}
                        >
                            {editingId ? 'Update Meal' : 'Save Meal'}
                        </Button>
                    </form>
                </Card>
            )}

            <RecommendationsSection />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedDiet.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Utensils size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No meals logged yet.</p>
                    </div>
                ) : (
                    sortedDiet.map((diet) => (
                        <Card key={diet.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.25rem'
                        }}>
                            <div
                                style={{ cursor: 'pointer', flex: 1 }}
                                onClick={() => handleEdit(diet)}
                                title="Click to edit"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}>{diet.mealType}</span>
                                    <h4 style={{ fontWeight: 600 }}>{diet.items}</h4>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {new Date(diet.date).toDateString()} • Health Score: {diet.healthRating}/5
                                    {diet.protein && <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>P: {diet.protein}g • C: {diet.carbs}g • F: {diet.fat}g</span>}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--accent-success)', marginRight: '1rem' }}>{diet.caloriesApprox} kcal</span>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(diet);
                                    }}
                                    variant="ghost"
                                    icon={<Pencil size={18} />}
                                    title="Edit"
                                />
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteDietEntry(diet.id);
                                    }}
                                    variant="ghost"
                                    style={{ color: 'var(--accent-danger)' }}
                                    icon={<Trash2 size={18} />}
                                    title="Delete"
                                />
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

const RecommendationsSection = () => {
    const { userProfile, labReports, dietEntries } = useHealth();
    const plan = getDietaryRecommendations(userProfile, labReports);

    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateInsights = async () => {
        if (!userProfile) return;

        setLoading(true);
        setError(null);
        try {
            // Rate Limit Check
            // Rate Limit Check
            // Rate Limit Check Removed as per user request
            // const uid = userProfile?.uid || user?.uid;
            // if (!uid) throw new Error("You must be logged in to use this feature (Session Invalid).");
            // const allowed = await checkAndIncrementUsage(uid, CONFIG.AI_DAILY_LIMIT); ...

            const result = await generateDietaryAnalysis(userProfile, labReports, dietEntries);
            setAiAnalysis(result);
        } catch (err: any) {
            console.error("AI Error:", err);
            setError(err.message || 'Failed to generate insights');
            alert(`AI Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!userProfile) return (
        <Card style={{ marginBottom: '2rem', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Complete your profile to get personalized recommendations.</p>
        </Card>
    );

    if (!plan && !aiAnalysis) return null;

    return (
        <Card style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Utensils size={20} /> {aiAnalysis ? 'AI-Powered Insights' : 'Recommended for You'}
                </h3>
                <Button
                    onClick={handleGenerateInsights}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    icon={loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                    style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                >
                    {loading ? 'Analyzing...' : 'Generate AI Report'}
                </Button>
            </div>

            {error && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {aiAnalysis ? (
                <div className="ai-analysis">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>AI Assessment</h4>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{aiAnalysis.analysis}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Recommended Foods</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {aiAnalysis.foodsToEat.map((food, i) => (
                                    <span key={i} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                                        {food}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Limit / Avoid</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {aiAnalysis.foodsToAvoid.map((food, i) => (
                                    <span key={i} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                                        {food}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Static Recommendations Fallback */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {/* Targets */}
                    <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Daily Targets</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                            {plan!.dailyCalories} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>kcal</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--accent-primary)' }}>Protein: {plan!.macros.protein}g</span>
                            <span style={{ color: 'var(--accent-warning)' }}>Carbs: {plan!.macros.carbs}g</span>
                            <span style={{ color: 'var(--accent-secondary)' }}>Fat: {plan!.macros.fat}g</span>
                        </div>
                    </div>

                    {/* Foods */}
                    <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Recommended Foods</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {plan!.recommendedFoods.map((food, i) => (
                                <span key={i} style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                                    {food}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Avoid */}
                    {plan!.foodsToAvoid.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Limit / Avoid</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {plan!.foodsToAvoid.map((food, i) => (
                                    <span key={i} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                                        {food}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!aiAnalysis && plan!.recommendations.length > 0 && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Personalized Advice</h4>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                        {plan!.recommendations.map((rec, i) => (
                            <li key={i} style={{ marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    );
};

export default DietPage;
