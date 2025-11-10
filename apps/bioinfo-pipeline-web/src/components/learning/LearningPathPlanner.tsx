"use client";

import React, { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { learningPaths } from '@/lib/learning-paths';

export default function LearningPathPlanner() {
  const [selectedPathId, setSelectedPathId] = useState(learningPaths[0]?.id ?? 'beginner');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const selectedPath = useMemo(
    () => learningPaths.find((path) => path.id === selectedPathId) ?? learningPaths[0],
    [selectedPathId],
  );

  if (!selectedPath) {
    return null;
  }

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {learningPaths.map((path) => {
          const isActive = path.id === selectedPath.id;
          return (
            <button
              key={path.id}
              onClick={() => setSelectedPathId(path.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-blue-500 bg-blue-500 text-white shadow'
                  : 'border-zinc-300 text-zinc-600 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              {path.label}
            </button>
          );
        })}
      </div>

      <Card elevation="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{selectedPath.label}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{selectedPath.persona}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{selectedPath.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedPath.skillFocus.map((skill) => (
                <Badge key={skill} tone="accent">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <div>
              已完成步骤：
              <span className="ml-1 font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedPath.steps.filter((step) => completedSteps[step.id]).length}/{selectedPath.steps.length}
              </span>
            </div>
            <button
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300"
              onClick={() =>
                setCompletedSteps((prev) => {
                  const next = { ...prev };
                  selectedPath.steps.forEach((step) => {
                    next[step.id] = false;
                  });
                  return next;
                })
              }
            >
              重置进度
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {selectedPath.steps.map((step, index) => {
            const isDone = !!completedSteps[step.id];
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 transition ${
                  isDone
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-900/20'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        STEP {index + 1}
                      </span>
                      {isDone ? <Badge tone="success">已完成</Badge> : null}
                    </div>
                    <h4 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h4>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{step.description}</p>
                    {step.resources && step.resources.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-2 text-xs text-blue-600 dark:text-blue-300">
                        {step.resources.map((res) => (
                          <li key={`${step.id}-${res.href}`}>
                            <a className="hover:underline" href={res.href} target={res.kind === 'external' ? '_blank' : undefined} rel={res.kind === 'external' ? 'noreferrer' : undefined}>
                              {res.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    {step.target ? (
                      <a
                        className="rounded-full border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/20"
                        href={step.target}
                      >
                        前往体验
                      </a>
                    ) : null}
                    <button
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isDone
                          ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300'
                          : 'border-zinc-300 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300'
                      }`}
                      onClick={() => toggleStep(step.id)}
                    >
                      {isDone ? '标记为未完成' : '标记为已完成'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
