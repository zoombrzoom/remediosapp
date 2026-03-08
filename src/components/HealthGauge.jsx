import React, { useEffect, useRef } from 'react'

const HealthGauge = ({ medicationsTaken, totalMedications, symptoms, aura = [], bathroomLevel = 0, painLevel = 0, bodyPainLevel = 0, fatigueLevel = 0, events = [], onExpand }) => {
    const canvasRef = useRef(null)

    const normalizedSymptoms = (symptoms || []).map(s =>
        typeof s === 'string'
            ? { name: s, impact: 1 }
            : s || {}
    )

    const totalSymptomImpactUnits = normalizedSymptoms.reduce(
        (total, s) => total + (typeof s.impact === 'number' ? s.impact : 1),
        0
    )

    const totalAuraBonus = (aura || []).reduce(
        (total, a) => total + (typeof a === 'string' ? 1 : (a?.impact || 1)),
        0
    )

    // Event Penalties (Stability component)
    const eventPenalties = {
        inter: 10,
        ps: 8,
        imuno: 4
    }

    // 70% Bem-estar: 100 - Pain*5 - BodyPain*4 - Fatigue*4 - Bathroom*3 - SymptomImpact*2 + AuraBonus*2
    const calculatedWellness = Math.max(0, Math.min(100, 100 - (painLevel * 5) - (bodyPainLevel * 4) - (fatigueLevel * 4) - (bathroomLevel * 3) - (totalSymptomImpactUnits * 2) + (totalAuraBonus * 2)))
    const wellP = (calculatedWellness / 100) * 70

    // 10% Sintomas (cada unidade de impacto tira 2% da nota total,
    // mantendo a mesma escala anterior, mas ponderada pelo peso)
    const symptomP = Math.max(0, 10 - (totalSymptomImpactUnits * 2))

    // 10% Remédios
    const medPercentage = totalMedications > 0 ? (medicationsTaken / totalMedications) * 100 : 0
    const medP = (medPercentage / 100) * 10

    // 10% Estabilidade (ausência de eventos graves)
    const eventPenaltyTotal = events.reduce((total, eventId) => total + (eventPenalties[eventId] || 0), 0)
    const stabilityP = Math.max(0, 10 - eventPenaltyTotal)

    const overallScore = Math.round(wellP + symptomP + medP + stabilityP)


    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height
        const centerX = width / 2
        const centerY = height - 20
        const radius = Math.min(width, height) - 40

        // Limpar
        ctx.clearRect(0, 0, width, height)

        // Ângulos do arco (180 graus = semicírculo)
        const startAngle = Math.PI
        const endAngle = 2 * Math.PI
        const progressAngle = startAngle + ((overallScore / 100) * Math.PI)

        // Track (fundo)
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.lineWidth = 16
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineCap = 'round'
        ctx.stroke()

        // Progress (Azul elétrico - Dashboard style)
        if (overallScore > 0) {
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius, startAngle, progressAngle)
            ctx.lineWidth = 16
            ctx.strokeStyle = '#3B82F6'
            ctx.lineCap = 'round'
            ctx.shadowColor = 'rgba(59, 130, 246, 0.5)'
            ctx.shadowBlur = 15
            ctx.stroke()
            ctx.shadowBlur = 0
        }

        // Needle (ponteiro)
        const needleAngle = startAngle + ((overallScore / 100) * Math.PI)
        const needleLength = radius - 30
        const needleX = centerX + Math.cos(needleAngle) * needleLength
        const needleY = centerY + Math.sin(needleAngle) * needleLength

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(needleX, needleY)
        ctx.lineWidth = 3
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineCap = 'round'
        ctx.stroke()

        // Centro
        ctx.beginPath()
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
        ctx.fillStyle = '#222222' // Dark Grey
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()

    }, [overallScore])

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    Status de Saúde
                </h3>
                <button className="btn btn-ghost btn-icon" onClick={onExpand}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                </button>
            </div>

            <div className="gauge-container">
                <canvas
                    ref={canvasRef}
                    width={280}
                    height={160}
                    className="gauge-canvas"
                />
            </div>

            <div className="gauge-stats">
                <div className="gauge-stat">
                    <span className="gauge-stat-dot" style={{ background: '#3B82F6' }}></span>
                    Meds {Math.round(medPercentage)}%
                </div>
                <div className="gauge-stat">
                    <span className="gauge-stat-dot" style={{ background: '#8B5CF6' }}></span>
                    Estabilidade {Math.round(stabilityP * 10)}%
                </div>
                <div className="gauge-stat">
                    <span className="gauge-stat-dot" style={{ background: '#22C55E' }}></span>
                    Bem-estar {Math.round(calculatedWellness)}%
                </div>
            </div>

            <div className="progress-container">
                <div className="progress-header">
                    <span className="progress-label">Progresso do Dia</span>
                    <span className="progress-value">{overallScore}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${overallScore}%` }}></div>
                </div>
            </div>
        </div>
    )
}

export default HealthGauge
