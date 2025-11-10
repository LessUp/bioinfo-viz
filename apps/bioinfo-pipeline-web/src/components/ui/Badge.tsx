import React from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning';

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  accent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export default function Badge({ tone = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass[tone]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
