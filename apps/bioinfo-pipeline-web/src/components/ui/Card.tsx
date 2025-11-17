import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  inset?: boolean;
  elevation?: 'none' | 'sm' | 'md';
}

const elevationMap: Record<NonNullable<CardProps['elevation']>, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-lg shadow-black/5 dark:shadow-black/40',
};

export default function Card({
  as: asProp = 'div',
  inset = false,
  elevation = 'sm',
  className = '',
  children,
  ...rest
}: CardProps) {
  const Component: React.ElementType = asProp;
  return (
    <Component
      className={[
        'rounded-xl border border-zinc-200/70 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80',
        inset ? 'p-0' : 'p-4',
        elevationMap[elevation],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Component>
  );
}
