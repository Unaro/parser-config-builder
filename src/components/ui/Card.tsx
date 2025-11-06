/**
 * Card компонент (Atom)
 * @module components/ui/Card
 * @version 1.0.0
 */

import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

/**
 * Card компонент
 */
export function Card({ 
  variant = 'default', 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  const baseStyles = 'rounded-lg bg-white';
  
  const variantStyles = {
    default: 'border border-gray-200',
    bordered: 'border-2 border-gray-300',
    elevated: 'shadow-lg'
  };
  
  const classes = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
  );
}

/**
 * Card Title
 */
export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
  );
}

/**
 * Card Description
 */
export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-gray-500 ${className}`} {...props} />
  );
}

/**
 * Card Content
 */
export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props} />
  );
}

/**
 * Card Footer
 */
export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
  );
}
