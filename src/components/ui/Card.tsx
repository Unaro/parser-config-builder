/**
 * Card UI компонент
 * @module components/ui/Card
 * @version 2.0.0
 */

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
  children: ReactNode;
}

export function Card({ 
  variant = 'default',
  className = '', 
  children, 
  ...props 
}: CardProps) {
  const variantStyles = {
    default: 'bg-white shadow-sm',
    bordered: 'bg-white border-2 border-blue-500 shadow-md'
  };

  return (
    <div 
      className={`rounded-lg overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  className = '', 
  children 
}: { 
  className?: string; 
  children: ReactNode;
}) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  className = '', 
  children 
}: { 
  className?: string; 
  children: ReactNode;
}) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ 
  className = '', 
  children 
}: { 
  className?: string; 
  children: ReactNode;
}) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ 
  className = '', 
  children 
}: { 
  className?: string; 
  children: ReactNode;
}) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
