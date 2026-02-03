import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string; disabled?: boolean }[];
}

export const Select = ({ label, options, className = '', ...props }: SelectProps) => {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <select className={`input ${className}`} {...props}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};
