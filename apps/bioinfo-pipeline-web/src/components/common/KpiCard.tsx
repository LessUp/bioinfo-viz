import React from 'react';

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
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {displayValue}
        {unit ? <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">{unit}</span> : null}
      </div>
      {footnote ? (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{footnote}</div>
      ) : null}
    </div>
  );
}
