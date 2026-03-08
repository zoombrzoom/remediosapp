import React from 'react'

const ProgressChart = ({ title, value, maxValue, unit, weeklyData, trend }) => {
    // Normalizar dados para barras de 0-100%
    const normalizeValue = (val) => {
        return Math.min(100, (val / maxValue) * 100)
    }

    // Calcular tendência
    const getTrendDisplay = () => {
        if (!trend || trend === 0) return null
        const isPositive = trend > 0
        return (
            <span className={`trend-badge ${isPositive ? 'trend-up' : 'trend-down'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
        )
    }

    return (
        <div className="progress-chart-card">
            <div className="progress-chart-header">
                <span className="progress-chart-title">{title}</span>
            </div>

            <div className="progress-chart-content">
                <div className="progress-chart-value">
                    <span className="value-number">{value}</span>
                    {unit && <span className="value-unit">{unit}</span>}
                    {getTrendDisplay()}
                </div>

                <div className="progress-chart-bars">
                    {weeklyData.map((data, index) => {
                        const isCurrentDay = index === weeklyData.length - 1
                        return (
                            <div
                                key={index}
                                className="bar-container"
                            >
                                <div
                                    className="bar"
                                    style={{
                                        height: `${normalizeValue(data)}%`,
                                        opacity: isCurrentDay ? 1 : 0.4 + (index * 0.08),
                                        background: isCurrentDay ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.25)'
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ProgressChart
