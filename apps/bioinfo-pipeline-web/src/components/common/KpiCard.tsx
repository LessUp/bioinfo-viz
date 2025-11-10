import React from 'react';
import Card from '@/components/ui/Card';

export default function KpiCard({
  title,
  value,
  unit,
  footnote,
}: {
  title: string;
  value: string | number;
  unit?: string;
  footnote?: string;
}) {
  const displayValue =
    typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
  return (
    <Card className="h-full">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {displayValue}
        {unit ? <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">{unit}</span> : null}
      </div>
      {footnote ? (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{footnote}</div>
      ) : null}
    </Card>
  );
}
