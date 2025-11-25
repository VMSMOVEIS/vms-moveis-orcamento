import React, { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, className = '', action }) => {
  return (
    <div className={`bg-blue-50 rounded-2xl border border-blue-200 shadow-lg shadow-blue-100/50 hover:shadow-blue-200/50 transition-shadow duration-300 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-5 border-b border-blue-100 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            {title && <h3 className="font-bold text-slate-800 text-lg tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'outline' | 'secondary' }> = ({ variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg shadow-indigo-200 hover:shadow-indigo-300",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-600 shadow-lg shadow-slate-200",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-500 border border-rose-100",
    outline: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-200"
  };

  return <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />;
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label htmlFor={id} className="text-sm font-semibold text-slate-700 ml-1">{label}</label>}
      <input
        id={id}
        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all
        focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
        disabled:bg-slate-100 disabled:text-slate-400 ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-500 ml-1">{error}</span>}
    </div>
  );
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', id, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label htmlFor={id} className="text-sm font-semibold text-slate-700 ml-1">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 appearance-none transition-all
          focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'amber' | 'red' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};