'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, ExternalLink, RotateCcw, Trophy } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { withBasePath } from '@/lib/base-path'
import { learningPaths } from '@/lib/learning-paths'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'bioinfo-learning-progress'

export default function LearningPathPlanner() {
  const [selectedPathId, setSelectedPathId] = useState(learningPaths[0]?.id ?? 'beginner')
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    try {
      return JSON.parse(saved) as Record<string, boolean>
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps))
  }, [completedSteps])

  const selectedPath = useMemo(
    () => learningPaths.find((path) => path.id === selectedPathId) ?? learningPaths[0],
    [selectedPathId]
  )

  if (!selectedPath) return null

  const steps = selectedPath.steps
  const completedCount = steps.filter((step) => completedSteps[step.id]).length
  const totalSteps = steps.length
  const progress = Math.round((completedCount / totalSteps) * 100)
  const isAllCompleted = completedCount === totalSteps && totalSteps > 0

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  const resetProgress = () => {
    if (typeof window !== 'undefined' && !window.confirm('确定要重置当前学习路径的进度吗？')) return
    setCompletedSteps((prev) => {
      const next = { ...prev }
      selectedPath.steps.forEach((step) => {
        delete next[step.id]
      })
      return next
    })
  }

  return (
    <div className="space-y-8">
      {/* Path Selection Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-zinc-100/50 p-1.5 dark:bg-zinc-900/50">
        {learningPaths.map((path) => {
          const isActive = path.id === selectedPath.id
          return (
            <button
              key={path.id}
              onClick={() => setSelectedPathId(path.id)}
              className={cn(
                'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:text-blue-400 dark:ring-white/10'
                  : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg ring-2 ring-blue-500/20 dark:ring-blue-400/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{path.label}</span>
            </button>
          )
        })}
      </div>

      <Card
        elevation="md"
        className="overflow-hidden border-0 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-black"
      >
        {/* Header & Progress */}
        <div className="flex flex-col gap-6 border-b border-zinc-100 pb-6 lg:flex-row lg:items-start lg:justify-between dark:border-zinc-800">
          <div className="space-y-4 max-w-2xl">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {selectedPath.label}
              </h3>
              <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {selectedPath.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPath.skillFocus.map((skill) => (
                <Badge key={skill} tone="accent" className="rounded-md px-2.5 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex min-w-[240px] flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900/50 dark:ring-zinc-800">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-500 dark:text-zinc-400">当前进度</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                {completedCount}/{totalSteps} 任务完成
              </span>
              {completedCount > 0 && (
                <button
                  onClick={resetProgress}
                  className="flex items-center gap-1 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  重置
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-8 space-y-4">
          <AnimatePresence mode="wait">
            {isAllCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200"
              >
                <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/50">
                  <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold">恭喜达成！</h4>
                  <p className="text-sm">你已经完成了该路径下的所有学习任务。</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {steps.map((step, index) => {
            const isDone = !!completedSteps[step.id]
            return (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md',
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10'
                    : 'border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700'
                )}
              >
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleStep(step.id)}
                    aria-label={
                      isDone ? `将「${step.title}」标记为未完成` : `将「${step.title}」标记为已完成`
                    }
                    className={cn(
                      'flex h-8 w-8 flex-none items-center justify-center rounded-full border transition-all',
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-300 text-transparent hover:border-emerald-400 hover:text-emerald-100 dark:border-zinc-600'
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>

                  <div className="flex-1 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h4
                          className={cn(
                            'font-semibold text-zinc-900 dark:text-zinc-100',
                            isDone && 'text-zinc-500 line-through dark:text-zinc-500'
                          )}
                        >
                          {step.title}
                        </h4>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {step.description}
                        </p>
                      </div>
                      {step.target && (() => {
                        const isExternal = /^https?:\/\//i.test(step.target ?? '')
                        const targetHref = isExternal ? step.target : withBasePath(step.target)
                        return (
                          <a
                            href={targetHref}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noreferrer' : undefined}
                            className="flex flex-none items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                          >
                            前往练习
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        )
                      })()}
                    </div>

                    {step.resources && step.resources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {step.resources.map((res) => (
                          <a
                            key={`${step.id}-${res.href}`}
                            href={res.kind === 'external' ? res.href : withBasePath(res.href)}
                            target={res.kind === 'external' ? '_blank' : undefined}
                            rel={res.kind === 'external' ? 'noreferrer' : undefined}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {res.kind === 'external' ? (
                              <ExternalLink className="h-3 w-3" />
                            ) : (
                              <BookOpen className="h-3 w-3" />
                            )}
                            {res.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
