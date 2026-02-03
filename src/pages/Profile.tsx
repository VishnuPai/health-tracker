import { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { User, Activity, Scale, Ruler, Calculator, Save, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import type { UserProfile } from '../types';

const Profile = () => {
    const { userProfile, updateUserProfile, apiKey, updateApiKey } = useHealth();

    // Local state for form
    const [name, setName] = useState(userProfile?.name || '');
    const [age, setAge] = useState(userProfile?.age?.toString() || '');
    const [gender, setGender] = useState<UserProfile['gender']>(userProfile?.gender || 'Male');
    const [height, setHeight] = useState(userProfile?.height?.toString() || '');
    const [weight, setWeight] = useState(userProfile?.weight?.toString() || '');
    const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(userProfile?.activityLevel || 'Sedentary');
    const [goal, setGoal] = useState<UserProfile['goal']>(userProfile?.goal || 'Maintain');

    // API Key State
    const [keyInput, setKeyInput] = useState(apiKey || '');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name);
            setAge(userProfile.age.toString());
            setGender(userProfile.gender);
            setHeight(userProfile.height.toString());
            setWeight(userProfile.weight.toString());
            setActivityLevel(userProfile.activityLevel);
            setGoal(userProfile.goal);
        }
    }, [userProfile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const profile: UserProfile = {
            name,
            age: Number(age),
            gender,
            height: Number(height),
            weight: Number(weight),
            activityLevel,
            goal
        };
        updateUserProfile(profile);
        alert('Profile saved successfully!');
    };

    // Calculations
    const calculateBMI = () => {
        if (!height || !weight) return null;
        const hMeter = Number(height) / 100;
        const wKg = Number(weight);
        const bmi = wKg / (hMeter * hMeter);
        return bmi.toFixed(1);
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'var(--accent-warning)' };
        if (bmi < 25) return { label: 'Healthy Weight', color: 'var(--accent-success)' };
        if (bmi < 30) return { label: 'Overweight', color: 'var(--accent-warning)' };
        return { label: 'Obese', color: 'var(--accent-danger)' };
    };

    const calculateBMR = () => {
        if (!height || !weight || !age) return null;
        const h = Number(height);
        const w = Number(weight);
        const a = Number(age);

        // Mifflin-St Jeor Equation
        let bmr = 10 * w + 6.25 * h - 5 * a;
        if (gender === 'Male') bmr += 5;
        else bmr -= 161;

        return Math.round(bmr);
    };

    const calculateTDEE = (bmr: number) => {
        const multipliers: Record<string, number> = {
            'Sedentary': 1.2,
            'Light': 1.375,
            'Moderate': 1.55,
            'Active': 1.725,
            'Very Active': 1.9
        };
        return Math.round(bmr * (multipliers[activityLevel] || 1.2));
    };

    const bmi = calculateBMI();
    const bmr = calculateBMR();
    const tdee = bmr ? calculateTDEE(bmr) : null;
    const bmiInfo = bmi ? getBMICategory(Number(bmi)) : null;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Profile & Vitals</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details and view health indicators.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Profile Form */}
                <Card>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} /> Personal Details
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Input
                            label="Name"
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Age"
                                required
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="e.g. 30"
                            />
                            <Select
                                label="Gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                                options={[
                                    { value: 'Male', label: 'Male' },
                                    { value: 'Female', label: 'Female' },
                                    { value: 'Other', label: 'Other' }
                                ]}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Height (cm)"
                                required
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="175"
                                endIcon={<Ruler size={16} />}
                            />
                            <Input
                                label="Weight (kg)"
                                required
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="70"
                                endIcon={<Scale size={16} />}
                            />
                        </div>

                        <Select
                            label="Activity Level"
                            value={activityLevel}
                            onChange={(e) => setActivityLevel(e.target.value as any)}
                            options={[
                                { value: 'Sedentary', label: 'Sedentary (Little or no exercise)' },
                                { value: 'Light', label: 'Light (Exercise 1-3 days/week)' },
                                { value: 'Moderate', label: 'Moderate (Exercise 4-5 days/week)' },
                                { value: 'Active', label: 'Active (Daily exercise)' },
                                { value: 'Very Active', label: 'Very Active (Intense exercise 6-7 days)' },
                            ]}
                        />

                        <Select
                            label="Fitness Goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value as any)}
                            options={[
                                { value: 'Lose Weight', label: 'Lose Weight' },
                                { value: 'Maintain', label: 'Maintain Weight' },
                                { value: 'Gain Muscle', label: 'Gain Muscle' },
                            ]}
                        />

                        <Button type="submit" variant="primary" icon={<Save size={20} />} style={{ marginTop: '1rem' }}>
                            Save Profile
                        </Button>
                    </form>
                </Card>

                {/* AI Settings */}
                <Card>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Key size={20} /> AI Settings
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Enter your Google Gemini API Key to enable AI-powered insights.
                            Your key is stored locally in your browser.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Gemini API Key"
                                    type={showKey ? 'text' : 'password'}
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    placeholder="Enter API Key"
                                />
                            </div>
                            <Button
                                variant="outline"
                                style={{ height: '46px' }}
                                onClick={() => setShowKey(!showKey)}
                            >
                                {showKey ? 'Hide' : 'Show'}
                            </Button>
                        </div>
                        <Button
                            onClick={() => updateApiKey(keyInput.trim())}
                            variant="primary"
                            disabled={keyInput.trim() === apiKey}
                        >
                            {keyInput.trim() === apiKey ? 'Saved' : 'Save API Key'}
                        </Button>
                    </div>
                </Card>

                {/* Indicators Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* BMI Card */}
                    <Card>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={20} /> Body Mass Index (BMI)
                        </h3>
                        {bmi && bmiInfo ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: bmiInfo.color }}>{bmi}</div>
                                <div style={{
                                    opacity: 0.9,
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '1rem',
                                    display: 'inline-block',
                                    marginTop: '0.5rem',
                                    fontWeight: 500
                                }}>
                                    {bmiInfo.label}
                                </div>
                                <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    BMI is a simple index of weight-for-height that is commonly used to classify underweight, overweight and obesity.
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Enter height and weight to calculate BMI.</p>
                        )}
                    </Card>

                    {/* BMR / TDEE Card */}
                    <Card>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calculator size={20} /> Daily Calorie Needs
                        </h3>
                        {bmr && tdee ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{bmr}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>BMR (Resting)</div>
                                    </div>
                                    <div style={{ width: '1px', backgroundColor: 'var(--border-subtle)' }}></div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{tdee}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Maint. Calories</div>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    Based on your activity level, you need approx <strong>{tdee} kcal</strong> to maintain your current weight.
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Enter all details to calculate daily calorie needs.</p>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default Profile;
