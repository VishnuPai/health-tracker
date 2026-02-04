
import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [strengthScore, setStrengthScore] = useState(0); // 0-3
    const navigate = useNavigate();

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (pass.length >= 8) score++;
        if (pass.length >= 8 && /\d/.test(pass) && /[a-zA-Z]/.test(pass)) score++;
        if (pass.length >= 8 && /\d/.test(pass) && /[a-zA-Z]/.test(pass) && /[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
        setStrengthScore(score);
    };

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return "Password must be at least 8 characters";
        if (!/[a-zA-Z]/.test(pass)) return "Password must contain at least one letter";
        if (!/\d/.test(pass)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!isLogin) {
            const passError = validatePassword(password);
            if (passError) {
                setError(passError);
                return;
            }
        }

        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
            navigate('/');
        } catch (err: any) {
            console.error(err);
            let msg = "Authentication failed";
            const code = err.code;

            if (code === 'auth/email-already-in-use') {
                msg = "This email is already registered. Please login instead.";
            } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                msg = "Invalid email or password.";
            } else if (code === 'auth/user-not-found') {
                msg = "No account found with this email.";
            } else if (code === 'auth/weak-password') {
                msg = "Password is too weak.";
            } else if (err.message) {
                msg = err.message;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleSignIn = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (err: any) {
            console.error(err); // Log full error for debugging
            let msg = "Google sign-in failed";
            if (err.code === 'auth/popup-closed-by-user') {
                msg = "Sign-in cancelled.";
            } else if (err.code === 'auth/unauthorized-domain') {
                msg = "Domain not authorized. Add this domain in Firebase Console -> Auth -> Settings.";
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await sendPasswordReset(email);
            setSuccess("Password reset email sent! Check your inbox.");
        } catch (err: any) {
            let msg = "Failed to send reset email.";
            if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
            <Card style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLogin ? 'Sign in to access your dashboard' : 'Start your health journey today'}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Button
                        variant={isLogin ? 'primary' : 'ghost'}
                        onClick={() => setIsLogin(true)}
                        style={{ flex: 1 }}
                    >
                        Login
                    </Button>
                    <Button
                        variant={!isLogin ? 'primary' : 'ghost'}
                        onClick={() => setIsLogin(false)}
                        style={{ flex: 1 }}
                    >
                        Sign Up
                    </Button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                const newPass = e.target.value;
                                setPassword(newPass);
                                if (!isLogin) calculateStrength(newPass);
                            }}
                            required
                            className="input"
                            placeholder={isLogin ? "Enter Password" : "Min 8 chars, 1 letter, 1 number, 1 special"}
                        />
                    </div>

                    {!isLogin && password && (
                        <div style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '4px' }}>
                                <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strengthScore >= 1 ? (strengthScore > 2 ? '#22c55e' : strengthScore === 2 ? '#eab308' : '#ef4444') : '#e5e7eb' }} />
                                <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strengthScore >= 2 ? (strengthScore > 2 ? '#22c55e' : '#eab308') : '#e5e7eb' }} />
                                <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strengthScore >= 3 ? '#22c55e' : '#e5e7eb' }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: strengthScore >= 3 ? '#16a34a' : strengthScore === 2 ? '#ca8a04' : '#dc2626', textAlign: 'right' }}>
                                {strengthScore === 0 ? 'Too Short' : strengthScore === 1 ? 'Weak' : strengthScore === 2 ? 'Medium' : 'Strong'}
                            </p>
                        </div>
                    )}

                    {isLogin && (
                        <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', fontSize: '0.9rem' }}>
                            {success}
                        </div>
                    )}

                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>
                </form>

                <div style={{ margin: '1.5rem 0', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', lineHeight: '0.1em' }}>
                    <span style={{ background: 'var(--bg-card)', padding: '0 10px', color: 'var(--text-muted)' }}>OR</span>
                </div>

                <Button
                    variant="secondary"
                    onClick={handleGoogleSignIn}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    disabled={loading}
                >
                    Sign in with Google
                </Button>
            </Card>
        </div>
    );
};

export default AuthPage;
