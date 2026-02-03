import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Utensils, Moon, LineChart, User, FlaskConical } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/workouts', label: 'Workouts', icon: Dumbbell },
        { path: '/diet', label: 'Diet', icon: Utensils },
        { path: '/sleep', label: 'Sleep', icon: Moon },
        { path: '/insights', label: 'Insights', icon: LineChart },
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/labs', label: 'Results', icon: FlaskConical },
    ];

    return (
        <aside style={{
            width: '240px',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-primary)', borderRadius: '8px' }}></div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>H&W Tracker</h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                            fontSize: '0.95rem',
                            fontWeight: isActive ? 500 : 400,
                            transition: 'all 0.2s ease'
                        })}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v1.0.0 Alpha</p>
            </div>
        </aside>
    );
};

export default Sidebar;
