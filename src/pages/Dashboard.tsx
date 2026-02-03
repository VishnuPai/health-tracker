import { useHealth } from '../context/HealthContext';
import { getTodayString } from '../utils/date';
import { Moon, Utensils, Activity, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';

const StatCard = ({ title, value, unit, icon: Icon, color }: { title: string, value: string | number, unit?: string, icon: any, color: string }) => (
    <Card style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}20`, color: color }}>
                <Icon size={20} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{value}</span>
            {unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{unit}</span>}
        </div>
    </Card>
);

const Dashboard = () => {
    const { workouts, dietEntries, sleepEntries } = useHealth();
    const today = getTodayString();

    const todayWorkouts = workouts.filter(w => w.date === today);
    const todayDiet = dietEntries.filter(d => d.date === today);
    const todaySleep = sleepEntries.filter(s => s.date === today);

    const caloriesBurned = todayWorkouts.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);
    const caloriesConsumed = todayDiet.reduce((acc, curr) => acc + curr.caloriesApprox, 0);
    const sleepDuration = todaySleep.length > 0 ? todaySleep[0].durationHours : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Overview for today, {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <StatCard
                    title="Sleep Duration"
                    value={sleepDuration}
                    unit="hrs"
                    icon={Moon}
                    color="var(--accent-primary)"
                />
                <StatCard
                    title="Calories Consumed"
                    value={caloriesConsumed}
                    unit="kcal"
                    icon={Utensils}
                    color="var(--accent-success)"
                />
                <StatCard
                    title="Calories Burned"
                    value={caloriesBurned}
                    unit="kcal"
                    icon={Activity}
                    color="var(--accent-warning)"
                />
                <StatCard
                    title="Workouts"
                    value={todayWorkouts.length}
                    unit="sessions"
                    icon={TrendingUp}
                    color="var(--accent-secondary)"
                />
            </div>

            <Card style={{
                padding: '2rem',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <p style={{ color: 'var(--text-muted)' }}>Weekly activity chart will appear here</p>
            </Card>
        </div>
    );
};

export default Dashboard;
