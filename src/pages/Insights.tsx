import { useHealth } from '../context/HealthContext';
import { TrendingUp, Battery, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';

const InsightCard = ({ title, description, icon: Icon, color }: { title: string, description: string, icon: any, color: string }) => (
    <Card style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: `${color}20`, color: color }}>
            <Icon size={24} />
        </div>
        <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{description}</p>
        </div>
    </Card>
);

const Insights = () => {
    const { workouts, sleepEntries, dietEntries } = useHealth();

    // Calculations
    const averageSleep = sleepEntries.length
        ? (sleepEntries.reduce((acc, curr) => acc + curr.durationHours, 0) / sleepEntries.length).toFixed(1)
        : 'N/A';

    const averageSleepQuality = sleepEntries.length
        ? (sleepEntries.reduce((acc, curr) => acc + curr.qualityScore, 0) / sleepEntries.length).toFixed(1)
        : 'N/A';

    const workoutDays = new Set(workouts.map(w => w.date));
    const sleepOnWorkoutDays = sleepEntries.filter(s => workoutDays.has(s.date));
    const sleepOnRestDays = sleepEntries.filter(s => !workoutDays.has(s.date));

    const avgSleepWorkoutDays = sleepOnWorkoutDays.length
        ? (sleepOnWorkoutDays.reduce((acc, curr) => acc + curr.durationHours, 0) / sleepOnWorkoutDays.length).toFixed(1)
        : 'N/A';

    const avgSleepRestDays = sleepOnRestDays.length
        ? (sleepOnRestDays.reduce((acc, curr) => acc + curr.durationHours, 0) / sleepOnRestDays.length).toFixed(1)
        : 'N/A';

    const totalCaloriesBurned = workouts.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);
    const totalCaloriesConsumed = dietEntries.reduce((acc, curr) => acc + curr.caloriesApprox, 0);

    return (
        <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Insights</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Automatic analysis of your health data</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <InsightCard
                    title="Sleep Patterns"
                    description={`Your average sleep duration is ${averageSleep} hours with an average quality score of ${averageSleepQuality}/5.`}
                    icon={Battery}
                    color="var(--accent-primary)"
                />

                <InsightCard
                    title="Workout Impact on Sleep"
                    description={
                        avgSleepWorkoutDays !== 'N/A' && avgSleepRestDays !== 'N/A'
                            ? `You sleep ${avgSleepWorkoutDays} hrs on workout days vs ${avgSleepRestDays} hrs on rest days.`
                            : "Log more sleep and workouts on the same days to see correlations."
                    }
                    icon={Zap}
                    color="var(--accent-warning)"
                />

                <InsightCard
                    title="Caloric Balance"
                    description={`Total logged burned calories: ${totalCaloriesBurned}. Total logged consumed calories: ${totalCaloriesConsumed}.`}
                    icon={TrendingUp}
                    color="var(--accent-success)"
                />
            </div>

            {workouts.length === 0 && sleepEntries.length === 0 && (
                <Card style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p>Log more data to unlock deeper insights!</p>
                </Card>
            )}
        </div>
    );
};

export default Insights;
