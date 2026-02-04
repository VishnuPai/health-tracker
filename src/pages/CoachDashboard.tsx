import { useEffect, useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { getAllUsers } from '../services/db';
import type { UserProfile } from '../types';
import { Card } from '../components/ui/Card';

const CoachDashboard = () => {
    const { role } = useHealth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await getAllUsers();
                // Filter out admins if coaches shouldn't see them, or just show everyone
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };

        if (role === 'coach' || role === 'admin') {
            fetchUsers();
        }
    }, [role]);

    if (role !== 'coach' && role !== 'admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Card>
                    <h2>Access Denied</h2>
                    <p>You must be a Coach or Admin to view this page.</p>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Coach Dashboard</h1>

            <Card>
                <h3 style={{ marginBottom: '1rem' }}>User List</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem' }}>Name/Email</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Goal</th>
                                <th style={{ padding: '1rem' }}>Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td></tr>
                            ) : users.map(u => (
                                <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{u.name || 'Unnamed'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{u.role || 'user'}</td>
                                    <td style={{ padding: '1rem' }}>{u.goal ? u.goal.replace('_', ' ') : '-'}</td>
                                    <td style={{ padding: '1rem' }}>-</td>
                                </tr>
                            ))}
                            {!loading && users.length === 0 && (
                                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center' }}>No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CoachDashboard;
