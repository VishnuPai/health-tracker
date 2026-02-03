import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Card = ({ children, className = '', ...props }: CardProps) => {
    return (
        <div className={`card ${className}`} {...props}>
            {children}
        </div>
    );
};
