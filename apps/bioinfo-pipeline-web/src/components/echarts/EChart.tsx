'use client'

import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export interface EChartProps {
  option: echarts.EChartsOption
  className?: string
  style?: React.CSSProperties
}

export default function EChart({ option, className, style }: EChartProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const instance = echarts.init(ref.current)
    chartRef.current = instance
    const resize = () => instance.resize()
    window.addEventListener('resize', resize)

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        instance.resize()
      })
      resizeObserver.observe(ref.current)
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      instance.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, { notMerge: true, lazyUpdate: true })
    }
  }, [option])

  return (
    <div ref={ref} className={className} style={{ width: '100%', height: 300, ...(style || {}) }} />
  )
}
