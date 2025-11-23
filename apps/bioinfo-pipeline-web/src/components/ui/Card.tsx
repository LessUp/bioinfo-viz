"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  as?: any;
  inset?: boolean;
  elevation?: 'none' | 'sm' | 'md';
  interactive?: boolean;
}

const elevationMap = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-lg shadow-black/5 dark:shadow-black/40',
};

export default function Card({
  as: Component = motion.div,
  inset = false,
  elevation = 'sm',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/95 backdrop-blur transition-colors dark:border-zinc-800 dark:bg-zinc-900/80',
        inset ? 'p-0' : 'p-6',
        elevationMap[elevation],
        interactive && 'cursor-pointer hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:border-blue-700/50 dark:hover:shadow-blue-900/10',
        className
      )}
      initial={interactive ? { y: 0 } : undefined}
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      {...rest}
    >
      {children}
    </Component>
  );
}
