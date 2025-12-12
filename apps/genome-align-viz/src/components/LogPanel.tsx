import React, { useEffect, useRef } from 'react'

export interface LogItem {
  ts: number
  level: 'info' | 'warn' | 'error'
  msg: string
}

export default function LogPanel({ logs }: { logs: LogItem[] }) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])
  const color = (lvl: string) =>
    lvl === 'error' ? 'text-red-400' : lvl === 'warn' ? 'text-yellow-400' : 'text-neutral-300'
  return (
    <div className="card p-3 h-48 overflow-auto text-sm">
      {logs.map((l, idx) => (
        <div key={idx} className={color(l.level)}>
          <span className="text-neutral-500 mr-2">{new Date(l.ts).toLocaleTimeString()}</span>
          <span className="uppercase mr-2">[{l.level}]</span>
          <span>{l.msg}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
