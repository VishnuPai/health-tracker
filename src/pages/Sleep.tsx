import { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { getTodayString } from '../utils/date';
import { Plus, Trash2, Moon } from 'lucide-react';
import type { Sleep } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';

const SleepPage = () => {
    const { sleepEntries, addSleepEntry, updateSleepEntry, deleteSleepEntry } = useHealth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [duration, setDuration] = useState('');
    const [quality, setQuality] = useState<Sleep['qualityScore']>(3);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newEntryData = {
            date: editingId ? (sleepEntries.find(s => s.id === editingId)?.date || getTodayString()) : getTodayString(),
            durationHours: Number(duration),
            qualityScore: quality
        };

        if (editingId) {
            updateSleepEntry({ ...newEntryData, id: editingId });
        } else {
            addSleepEntry({ ...newEntryData, id: Date.now().toString() });
        }

        closeForm();
    };

    const handleEdit = (sleep: Sleep) => {
        setEditingId(sleep.id);
        setDuration(sleep.durationHours.toString());
        setQuality(sleep.qualityScore);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        resetForm();
    };

    const resetForm = () => {
        setDuration('');
        setQuality(3);
    };

    const sortedSleep = [...sleepEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>Sleep</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Track your rest and recovery</p>
                </div>
                <Button
                    onClick={() => {
                        if (isFormOpen) closeForm();
                        else setIsFormOpen(true);
                    }}
                    variant={isFormOpen ? 'secondary' : 'primary'}
                    icon={<Plus size={20} style={{ transform: isFormOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />}
                >
                    {isFormOpen ? 'Cancel' : 'Log Sleep'}
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
                        <Input
                            label="Duration (Hours)"
                            required
                            type="number"
                            step="0.5"
                            placeholder="8.0"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />

                        <Select
                            label="Quality (1-5)"
                            value={String(quality)}
                            onChange={(e) => setQuality(Number(e.target.value) as any)}
                            options={[
                                { value: '1', label: '1 - Poor' },
                                { value: '2', label: '2 - Fair' },
                                { value: '3', label: '3 - Good' },
                                { value: '4', label: '4 - Very Good' },
                                { value: '5', label: '5 - Excellent' },
                            ]}
                        />

                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '2px' }}>
                            <Button
                                type="submit"
                                variant="success"
                                fullWidth
                            >
                                {editingId ? 'Update Sleep' : 'Save Sleep'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedSleep.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Moon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No sleep logs available.</p>
                    </div>
                ) : (
                    sortedSleep.map((sleep) => (
                        <Card key={sleep.id} style={{
                            padding: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div
                                style={{ cursor: 'pointer', flex: 1 }}
                                onClick={() => handleEdit(sleep)}
                                title="Click to edit"
                            >
                                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{new Date(sleep.date).toDateString()}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Quality: {sleep.qualityScore}/5
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{sleep.durationHours} hrs</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSleepEntry(sleep.id);
                                    }}
                                    style={{ color: 'var(--text-muted)' }}
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

export default SleepPage;
