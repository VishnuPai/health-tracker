import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    endIcon?: React.ReactNode;
}

export const Input = ({ label, error, endIcon, className = '', style, ...props }: InputProps) => {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <div style={{ position: 'relative' }}>
                <input
                    className={`input ${className}`}
                    style={{
                        borderColor: error ? 'var(--accent-danger)' : undefined,
                        paddingRight: endIcon ? '2.5rem' : undefined,
                        ...style
                    }}
                    {...props}
                />
                {endIcon && (
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        {endIcon}
                    </div>
                )}
            </div>
            {error && <span style={{ color: 'var(--accent-danger)', fontSize: '0.8rem' }}>{error}</span>}
        </div>
    );
};
