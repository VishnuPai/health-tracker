import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'neutral' | 'success' | 'warning' | 'danger';
    icon?: React.ReactNode;
}

export const Badge = ({ variant = 'neutral', icon, children, className, ...props }: BadgeProps) => {
    return (
        <span className={`badge badge-${variant} ${className || ''}`} {...props}>
            {icon}
            {children}
        </span>
    );
};
