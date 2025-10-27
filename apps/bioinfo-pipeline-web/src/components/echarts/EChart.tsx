"use client";

import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

export interface EChartProps {
  option: echarts.EChartsOption;
  className?: string;
  style?: React.CSSProperties;
}

export default function EChart({ option, className, style }: EChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = echarts.init(ref.current);
    chartRef.current = instance;
    const resize = () => instance.resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      instance.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, { notMerge: true, lazyUpdate: true });
    }
  }, [option]);

  return <div ref={ref} className={className} style={{ width: "100%", height: 300, ...(style || {}) }} />;
}
