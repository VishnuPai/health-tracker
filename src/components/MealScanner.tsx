import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { analyzeFoodImage, type ScannedFoodResult } from '../services/gemini';

interface MealScannerProps {
    onScanComplete: (result: ScannedFoodResult) => void;
    onCancel: () => void;
}

export const MealScanner = ({ onScanComplete, onCancel }: MealScannerProps) => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setLoading(true);
        setError(null);

        try {
            // Remove data:image/jpeg;base64, prefix
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];

            const result = await analyzeFoodImage(base64Data, mimeType);
            onScanComplete(result);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to analyze image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ border: '2px dashed var(--border-subtle)', textAlign: 'center', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Scan Meal</h3>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {!image ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'
                    }}>
                        <Camera size={32} color="var(--accent-primary)" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Snap a photo or upload an image of your meal.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="primary"
                            icon={<Upload size={18} />}
                        >
                            Upload Photo
                        </Button>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment" // Opens camera on mobile
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '300px' }}>
                        <img src={image} alt="Meal Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        <button
                            onClick={() => setImage(null)}
                            style={{
                                position: 'absolute', top: '10px', right: '10px',
                                backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                                border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {error && (
                        <div style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Button
                            onClick={handleAnalyze}
                            variant="success"
                            disabled={loading}
                            icon={loading ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
                            style={{ minWidth: '150px' }}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Meal'}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
