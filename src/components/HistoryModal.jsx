import React, { useState, useMemo } from 'react'
import '../overrides.css' // Ensure we have access to variables if needed

const HistoryModal = ({ isOpen, onClose, historyData }) => {
    const [viewMode, setViewMode] = useState('weekly') // 'weekly' or 'monthly'

    // Use real data from props
    const data = useMemo(() => {
        if (!historyData || !historyData[viewMode]) return []
        return historyData[viewMode]
    }, [historyData, viewMode])

    // Graph Calculation
    const getPath = () => {
        if (data.length === 0) return ''
        const width = 500
        const height = 200
        const padding = 20
        const contentWidth = width - (padding * 2)
        const contentHeight = height - (padding * 2)

        const xStep = contentWidth / (data.length - 1)

        // Map values to coordinates
        const points = data.map((d, i) => {
            const x = padding + (i * xStep)
            const y = height - padding - ((d.value / 100) * contentHeight)
            return `${x},${y}`
        })

        // Create smooth curve (catmull-rom or simple line)
        // For simplicity and "tech" look, straight lines with small circles are fine, 
        // or a simple cubic bezier if we want smooth. Let's do straight for now for reliability.
        return `M ${points.join(' L ')}`
    }

    const pathD = getPath()

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="card modal-content" onClick={e => e.stopPropagation()} style={{
                width: '90%',
                maxWidth: '600px',
                padding: '24px',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="card-title text-xl">Histórico de Bem-Estar</h3>
                    <button onClick={onClose} className="btn-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Controls */}
                <div className="flex justify-center mb-8 gap-4">
                    <button
                        className={`btn ${viewMode === 'weekly' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('weekly')}
                        style={{ minWidth: '100px' }}
                    >
                        Semanal
                    </button>
                    <button
                        className={`btn ${viewMode === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('monthly')}
                        style={{ minWidth: '100px' }}
                    >
                        Mensal
                    </button>
                </div>

                {/* Graph Area */}
                <div className="graph-container p-4" style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <svg viewBox="0 0 500 250" className="w-full h-full" style={{ overflow: 'visible' }}>
                        {/* Grid Lines */}
                        <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                        <line x1="20" y1="110" x2="480" y2="110" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                        <line x1="20" y1="200" x2="480" y2="200" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />

                        {/* Chart Line */}
                        <path
                            d={pathD}
                            fill="none"
                            stroke="#EDEDED"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))' }}
                        />

                        {/* Gradient Fill (Optional, needs defs) - keeping simple line for now */}

                        {/* Points and Labels */}
                        {data.map((d, i) => {
                            const width = 500
                            const height = 200
                            const padding = 20
                            const contentWidth = width - (padding * 2)
                            const contentHeight = height - (padding * 2)
                            const xStep = contentWidth / (data.length - 1)
                            const x = padding + (i * xStep)
                            const y = height - padding - ((d.value / 100) * contentHeight)

                            // Logic for density control
                            const isMonthly = viewMode === 'monthly'
                            const showXLabel = !isMonthly || i % 5 === 0 || i === data.length - 1
                            const showValueLabel = !isMonthly || i % 5 === 0 || i === data.length - 1
                            const dotRadius = isMonthly ? 4 : 6

                            return (
                                <g key={i} className="graph-point group">
                                    <circle cx={x} cy={y} r={dotRadius} fill="#1a1a1a" stroke="#EDEDED" strokeWidth={isMonthly ? "1.5" : "2"} />

                                    {/* Tooltip-like Label (Condensed in Monthly) */}
                                    {showValueLabel && (
                                        <text x={x} y={y - (isMonthly ? 10 : 15)} textAnchor="middle" fill="#EDEDED" fontSize={isMonthly ? "10" : "12"} style={{ opacity: 0.8 }}>
                                            {d.value}%
                                        </text>
                                    )}

                                    {/* X Axis Label (Condensed in Monthly) */}
                                    {showXLabel && (
                                        <text x={x} y={240} textAnchor="middle" fill="#A0A0A0" fontSize="12">
                                            {d.label}
                                        </text>
                                    )}
                                </g>
                            )
                        })}
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default HistoryModal
