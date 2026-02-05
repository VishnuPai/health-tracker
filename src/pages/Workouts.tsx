import { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { getTodayString } from '../utils/date';
import { Plus, Trash2, Dumbbell, Pencil } from 'lucide-react';
import type { Workout } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const Workouts = () => {
    const { workouts, addWorkout, updateWorkout, deleteWorkout } = useHealth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [activity, setActivity] = useState('');
    const [duration, setDuration] = useState('');
    const [intensity, setIntensity] = useState<Workout['intensity']>('Medium');
    const [calories, setCalories] = useState('');
    const [distance, setDistance] = useState('');
    const [pace, setPace] = useState('');
    const [laps, setLaps] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const workoutData = {
                activity,
                durationMinutes: Number(duration),
                intensity,
                caloriesBurned: calories ? Number(calories) : undefined,
                distance: distance ? Number(distance) : undefined,
                pace: pace ? Number(pace) : undefined,
                laps: laps ? Number(laps) : undefined,
            };

            if (editingId) {
                // Update existing
                const updatedWorkout: Workout = {
                    id: editingId,
                    date: workouts.find(w => w.id === editingId)?.date || getTodayString(), // Keep original date or default
                    ...workoutData
                };
                await updateWorkout(updatedWorkout);
            } else {
                // Create new
                const newWorkout: Workout = {
                    id: Date.now().toString(),
                    date: getTodayString(),
                    ...workoutData
                };
                await addWorkout(newWorkout);
            }

            closeForm();
            alert("Workout saved successfully!");
        } catch (err: any) {
            console.error("Failed to save workout:", err);
            alert(`Failed to save workout: ${err.message}`);
        }
    };

    const handleEdit = (workout: Workout) => {
        setEditingId(workout.id);
        setActivity(workout.activity);
        setDuration(workout.durationMinutes.toString());
        setIntensity(workout.intensity);
        setCalories(workout.caloriesBurned ? workout.caloriesBurned.toString() : '');
        setDistance(workout.distance ? workout.distance.toString() : '');
        setPace(workout.pace ? workout.pace.toString() : '');
        setLaps(workout.laps ? workout.laps.toString() : '');
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setActivity('');
        setDuration('');
        setIntensity('Medium');
        setCalories('');
        setDistance('');
        setPace('');
        setLaps('');
    };

    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>Workouts</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Log and track your physical activities</p>
                </div>
                <Button
                    onClick={() => {
                        if (isFormOpen) closeForm();
                        else setIsFormOpen(true);
                    }}
                    variant={isFormOpen ? 'secondary' : 'primary'}
                    icon={<Plus size={20} style={{ transform: isFormOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />}
                >
                    {isFormOpen ? 'Cancel' : 'Log Workout'}
                </Button>
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
                            label="Activity Type"
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            options={[
                                { value: '', label: 'Select Activity', disabled: true },
                                { value: 'Running', label: 'Running' },
                                { value: 'Walking', label: 'Walking' },
                                { value: 'Swimming', label: 'Swimming' },
                                { value: 'Strength Training', label: 'Strength Training' },
                                { value: 'Yoga', label: 'Yoga' },
                                { value: 'Cycling', label: 'Cycling' },
                                { value: 'Other', label: 'Other' }
                            ]}
                            required
                        />

                        <Input
                            label="Duration (min)"
                            required
                            type="number"
                            placeholder="30"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />

                        {(activity === 'Running' || activity === 'Walking' || activity === 'Cycling') && (
                            <>
                                <Input
                                    label="Distance (km)"
                                    type="number"
                                    step="0.01"
                                    placeholder="5.0"
                                    value={distance}
                                    onChange={(e) => setDistance(e.target.value)}
                                />
                                <Input
                                    label="Pace (min/km)"
                                    type="number"
                                    step="0.1"
                                    placeholder="5.3"
                                    value={pace}
                                    onChange={(e) => setPace(e.target.value)}
                                />
                            </>
                        )}

                        {activity === 'Swimming' && (
                            <Input
                                label="Laps"
                                type="number"
                                placeholder="20"
                                value={laps}
                                onChange={(e) => setLaps(e.target.value)}
                            />
                        )}

                        <Select
                            label="Intensity"
                            value={intensity}
                            onChange={(e) => setIntensity(e.target.value as Workout['intensity'])}
                            options={[
                                { value: 'Low', label: 'Low' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'High', label: 'High' }
                            ]}
                        />

                        <Input
                            label="Calories (Est.)"
                            type="number"
                            placeholder="Optional"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                        />

                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '2px' }}>
                            <Button
                                type="submit"
                                variant="success"
                                fullWidth
                            >
                                {editingId ? 'Update Entry' : 'Save Entry'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedWorkouts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Dumbbell size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No workouts logged yet. Start today!</p>
                    </div>
                ) : (
                    sortedWorkouts.map((workout) => (
                        <Card key={workout.id} style={{
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderLeft: `4px solid ${workout.intensity === 'High' ? 'var(--accent-danger)' :
                                workout.intensity === 'Medium' ? 'var(--accent-warning)' : 'var(--accent-success)'
                                }`
                        }}>
                            <div
                                style={{ cursor: 'pointer', flex: 1 }}
                                onClick={() => handleEdit(workout)} // Click to edit
                                title="Click to edit"
                            >
                                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{workout.activity}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {new Date(workout.date).toDateString()} • {workout.durationMinutes} mins
                                    {workout.distance && ` • ${workout.distance} km`}
                                    {workout.laps && ` • ${workout.laps} laps`}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {workout.pace && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                        {workout.pace} min/km
                                    </span>
                                )}
                                {workout.caloriesBurned && (
                                    <Badge variant="warning" style={{ marginRight: '0.5rem' }}>
                                        {workout.caloriesBurned} kcal
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(workout);
                                    }}
                                    title="Edit"
                                >
                                    <Pencil size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteWorkout(workout.id);
                                    }}
                                    style={{ color: 'var(--accent-danger)' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Workouts;
