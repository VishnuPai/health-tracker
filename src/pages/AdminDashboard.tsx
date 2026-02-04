import { useEffect, useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { getAllUsers, updateUserProfile } from '../services/db';
import type { UserProfile } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const AdminDashboard = () => {
    const { user, role } = useHealth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'admin') {
            fetchUsers();
        }
    }, [role]);

    const handleRoleChange = async (targetUid: string, newRole: 'user' | 'coach' | 'admin') => {
        if (!targetUid) return;
        try {
            await updateUserProfile(targetUid, { role: newRole });
            // Refresh local list
            setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Failed to update role", error);
        }
    };

    // If not admin, show Access Denied with the Dev Backdoor
    if (role !== 'admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Card>
                    <h2>Access Denied</h2>
                    <p>You must be an admin to view this page.</p>

                    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Developer Helper:</p>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                console.log("Dev button clicked. User:", user);
                                if (!user || !user.uid) {
                                    alert("Error: No user found. Are you logged in?");
                                    return;
                                }

                                try {
                                    const confirm = window.confirm(`Promote user ${user.email} (${user.uid}) to Admin?`);
                                    if (!confirm) return;

                                    await handleRoleChange(user.uid, 'admin');
                                    alert("Success! Role updated to Admin. Reloading page...");
                                    window.location.reload();
                                } catch (e: any) {
                                    console.error("Promotion failed:", e);
                                    alert("Error promoting user: " + (e?.message || JSON.stringify(e)));
                                }
                            }}
                            style={{ border: '2px dashed red', color: 'red', width: '100%' }}
                        >
                            (Dev) Make Me Admin
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Admin Dashboard</h1>

            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>Loading users...</td></tr>
                            ) : users.map(u => (
                                <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '1rem' }}>{u.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            backgroundColor: u.role === 'admin' ? '#ef4444' : u.role === 'coach' ? '#3b82f6' : '#22c55e',
                                            color: 'white'
                                        }}>
                                            {u.role || 'user'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        {u.role !== 'coach' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleRoleChange(u.uid!, 'coach')}
                                            >
                                                Promote to Coach
                                            </Button>
                                        )}
                                        {u.role === 'coach' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRoleChange(u.uid!, 'user')}
                                            >
                                                Demote to User
                                            </Button>
                                        )}
                                        {u.role !== 'admin' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                style={{ color: '#ef4444' }}
                                                onClick={() => handleRoleChange(u.uid!, 'admin')}
                                            >
                                                Make Admin
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminDashboard;
