import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button = ({
    className = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
    children,
    ...props
}: ButtonProps) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size === 'md' ? '' : `btn-${size}`;
    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            style={{ width: fullWidth ? '100%' : undefined }}
            {...props}
        >
            {icon && <span className="btn-icon-wrapper">{icon}</span>}
            {children}
        </button>
    );
};
