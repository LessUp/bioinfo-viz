import React, { useMemo, useState } from 'react'
import { useAppStore, type SourceType } from '../store/useAppStore'
import { ZoomIn, ZoomOut, Play, Square } from 'lucide-react'

export default function ControlPanel() {
  const {
    region,
    setRegion,
    zoom,
    filters,
    setFilters,
    connection,
    setConnection,
    connect,
    disconnect,
    teaching,
    setTeaching,
  } = useAppStore()
  const [tempRegion, setTempRegion] = useState(region)
  const [tempUrl, setTempUrl] = useState(connection.url)

  const canConnect = useMemo(() => {
    if (connection.sourceType === 'mock') return true
    return !!tempUrl
  }, [connection.sourceType, tempUrl])

  function applyRegion() {
    if (
      !tempRegion.chrom ||
      isNaN(tempRegion.start) ||
      isNaN(tempRegion.end) ||
      tempRegion.end <= tempRegion.start
    )
      return
    setRegion(tempRegion)
  }

  function onSourceChange(type: SourceType) {
    setConnection({ sourceType: type })
  }

  return (
    <div className="card p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm text-neutral-300 mr-2">区域</div>
        <input
          className="px-2 py-1 bg-neutral-800 rounded w-24"
          value={tempRegion.chrom}
          onChange={(e) => setTempRegion({ ...tempRegion, chrom: e.target.value })}
        />
        <input
          className="px-2 py-1 bg-neutral-800 rounded w-28"
          value={tempRegion.start}
          onChange={(e) =>
            setTempRegion({ ...tempRegion, start: parseInt(e.target.value || '0', 10) })
          }
        />
        <span className="text-neutral-500">-</span>
        <input
          className="px-2 py-1 bg-neutral-800 rounded w-28"
          value={tempRegion.end}
          onChange={(e) =>
            setTempRegion({ ...tempRegion, end: parseInt(e.target.value || '0', 10) })
          }
        />
        <button className="px-2 py-1 bg-blue-600 rounded" onClick={applyRegion}>
          应用
        </button>
        <div className="ml-2 flex items-center gap-1">
          <button
            className="px-2 py-1 bg-neutral-800 rounded inline-flex items-center"
            onClick={() => zoom(0.7)}
          >
            <ZoomIn size={16} className="mr-1" />
            放大
          </button>
          <button
            className="px-2 py-1 bg-neutral-800 rounded inline-flex items-center"
            onClick={() => zoom(1.3)}
          >
            <ZoomOut size={16} className="mr-1" />
            缩小
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-300">最小 MAPQ</label>
          <input
            type="range"
            min={0}
            max={60}
            value={filters.minMapq}
            onChange={(e) => setFilters({ minMapq: parseInt(e.target.value, 10) })}
          />
          <span className="w-8 text-right text-sm text-neutral-400">{filters.minMapq}</span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.showMismatches}
            onChange={(e) => setFilters({ showMismatches: e.target.checked })}
          />
          显示错配
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.showIndels}
            onChange={(e) => setFilters({ showIndels: e.target.checked })}
          />
          显示 Indel
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.showVariants}
            onChange={(e) => setFilters({ showVariants: e.target.checked })}
          />
          显示变异
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-neutral-300 mr-1">数据源</div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              checked={connection.sourceType === 'mock'}
              onChange={() => onSourceChange('mock')}
            />
            Mock
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              checked={connection.sourceType === 'sse'}
              onChange={() => onSourceChange('sse')}
            />
            SSE
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              checked={connection.sourceType === 'ws'}
              onChange={() => onSourceChange('ws')}
            />
            WS
          </label>
        </div>
        {(connection.sourceType === 'sse' || connection.sourceType === 'ws') && (
          <input
            className="px-2 py-1 bg-neutral-800 rounded w-80"
            placeholder="http://host/stream"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            onBlur={() => setConnection({ url: tempUrl })}
          />
        )}
        <div className="ml-auto flex items-center gap-2">
          {!connection.connected ? (
            <button
              className={`px-2 py-1 rounded inline-flex items-center ${canConnect ? 'bg-green-600' : 'bg-neutral-700 cursor-not-allowed'}`}
              onClick={() => canConnect && connect()}
            >
              <Play size={16} className="mr-1" />
              连接
            </button>
          ) : (
            <button
              className="px-2 py-1 bg-red-600 rounded inline-flex items-center"
              onClick={() => disconnect()}
            >
              <Square size={16} className="mr-1" />
              断开
            </button>
          )}
          <label className="flex items-center gap-2 text-sm ml-2">
            <input
              type="checkbox"
              checked={teaching.enabled}
              onChange={(e) => setTeaching({ enabled: e.target.checked })}
            />
            教学模式
          </label>
        </div>
      </div>
    </div>
  )
}
