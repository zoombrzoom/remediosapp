import React from 'react'

const DailyControls = ({ controls, onControlChange }) => {
    const sliders = [
        {
            id: 'corticoide',
            label: 'Corticoide',
            unit: 'mg',
            min: 0,
            max: 100,
            step: 5
        },
        {
            id: 'bathroom',
            label: 'Idas ao Banheiro',
            unit: '',
            min: 0,
            max: 20,
            step: 1
        },
        {
            id: 'pain',
            label: 'Nível de Dor',
            unit: '/10',
            min: 0,
            max: 10,
            step: 1
        },
        {
            id: 'bodyPain',
            label: 'Dor no Corpo',
            unit: '/10',
            min: 0,
            max: 10,
            step: 1
        },
        {
            id: 'fatigue',
            label: 'Cansaço',
            unit: '/10',
            min: 0,
            max: 10,
            step: 1
        }
    ]

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="M18 17V9" />
                        <path d="M13 17V5" />
                        <path d="M8 17v-3" />
                    </svg>
                    Controle Diário
                </h3>
            </div>

            {sliders.map(slider => (
                <div key={slider.id} className="slider-container">
                    <div className="slider-label">
                        <span>{slider.label}</span>
                        <span className="slider-value">
                            {controls[slider.id] || 0}{slider.unit && ` ${slider.unit}`}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={controls[slider.id] || 0}
                        onChange={(e) => onControlChange(slider.id, parseInt(e.target.value))}
                        style={{
                            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((controls[slider.id] || 0) - slider.min) / (slider.max - slider.min) * 100}%, rgba(255,255,255,0.12) ${((controls[slider.id] || 0) - slider.min) / (slider.max - slider.min) * 100}%, rgba(255,255,255,0.12) 100%)`
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

export default DailyControls
