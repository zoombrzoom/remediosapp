import React, { useState } from 'react'

const EventsSymptoms = ({
    events,
    symptoms,
    sosMedications,
    aura = [],
    onToggleEvent,
    onAddSymptom,
    onAddSosMed,
    onRemoveSymptom,
    onRemoveSosMed,
    onAddAura,
    onRemoveAura,
    onAnalyze,
    onExportPDF,
    onBackup,
    onRestore
}) => {
    const [newSymptom, setNewSymptom] = useState('')
    const [newSymptomImpact, setNewSymptomImpact] = useState(2)
    const [newSosMed, setNewSosMed] = useState('')
    const [newAura, setNewAura] = useState('')
    const [newAuraImpact, setNewAuraImpact] = useState(2)

    const eventTypes = [
        {
            id: 'imuno',
            label: 'Imuno',
            icon: <img src="/icons/imuno.png" alt="Imuno" className="w-full h-full object-cover" />,
            color: '#FFFFFF'
        },
        {
            id: 'ps',
            label: 'PS',
            icon: <img src="/icons/ps.png" alt="PS" className="w-full h-full object-cover" />,
            color: '#FFFFFF'
        },
        {
            id: 'inter',
            label: 'Inter.',
            icon: <img src="/icons/inter.png" alt="Internação" className="w-full h-full object-cover" />,
            color: '#FFFFFF'
        }
    ]

    const handleAddSymptom = () => {
        if (newSymptom.trim()) {
            onAddSymptom({
                name: newSymptom.trim(),
                impact: Number(newSymptomImpact) || 1
            })
            setNewSymptom('')
            setNewSymptomImpact(2)
        }
    }

    const handleAddSosMed = () => {
        if (newSosMed.trim()) {
            onAddSosMed(newSosMed.trim())
            setNewSosMed('')
        }
    }

    const handleAddAura = () => {
        if (newAura.trim()) {
            onAddAura({
                name: newAura.trim(),
                impact: Number(newAuraImpact) || 1
            })
            setNewAura('')
            setNewAuraImpact(2)
        }
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result)
                    onRestore(data)
                } catch (error) {
                    alert('Arquivo inválido')
                }
            }
            reader.readAsText(file)
        }
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Eventos & Sintomas
                </h3>
            </div>

            {/* Event Tags */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {eventTypes.map(event => {
                    const isActive = events.includes(event.id)
                    return (
                        <button
                            key={event.id}
                            onClick={() => onToggleEvent(event.id)}
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: isActive ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isActive ? '0 0 15px rgba(var(--color-primary-rgb), 0.5)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box',
                                flexShrink: 0
                            }}
                        >
                            <span style={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {event.icon}
                            </span>
                        </button>
                    )
                })}
            </div>


            {/* Sintomas */}
            <div className="section-label">SINTOMAS</div>
            <div className="input-group mb-md">
                <input
                    type="text"
                    placeholder="Ex: Enxaqueca"
                    value={newSymptom}
                    onChange={(e) => setNewSymptom(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSymptom()}
                />
                <select
                    className="input-select"
                    value={newSymptomImpact}
                    onChange={(e) => setNewSymptomImpact(Number(e.target.value) || 1)}
                >
                    <option value={1}>Leve</option>
                    <option value={2}>Moderado</option>
                    <option value={3}>Intenso</option>
                </select>
                <button className="btn btn-primary btn-icon" onClick={handleAddSymptom}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>

            {symptoms.length > 0 && (
                <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                    {symptoms.map((symptom, index) => (
                        (() => {
                            const normalized = typeof symptom === 'string'
                                ? { name: symptom, impact: 1 }
                                : symptom || {}

                            const impact = normalized.impact || 1
                            const impactLabel = impact === 1 ? 'leve' : impact === 3 ? 'intenso' : 'moderado'

                            return (
                                <span
                                    key={index}
                                    className="badge badge-warning"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => onRemoveSymptom(index)}
                                >
                                    {normalized.name || 'Sintoma'} ({impactLabel}) ✕
                                </span>
                            )
                        })()
                    ))}
                </div>
            )}

            {/* Aura Positiva */}
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.875rem' }}>✨</span> AURA POSITIVA
            </div>
            <div className="input-group mb-md" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                <input
                    type="text"
                    placeholder="Ex: Caminhada, Sol, Meditação"
                    value={newAura}
                    onChange={(e) => setNewAura(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAura()}
                />
                <select
                    className="input-select"
                    value={newAuraImpact}
                    onChange={(e) => setNewAuraImpact(Number(e.target.value) || 1)}
                >
                    <option value={1}>Leve</option>
                    <option value={2}>Moderado</option>
                    <option value={3}>Intenso</option>
                </select>
                <button className="btn btn-aura btn-icon" onClick={handleAddAura}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>

            {aura.length > 0 && (
                <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                    {aura.map((item, index) => {
                        const normalized = typeof item === 'string'
                            ? { name: item, impact: 1 }
                            : item || {}

                        const impact = normalized.impact || 1
                        const impactLabel = impact === 1 ? 'leve' : impact === 3 ? 'intenso' : 'moderado'

                        return (
                            <span
                                key={index}
                                className="badge badge-aura"
                                style={{ cursor: 'pointer' }}
                                onClick={() => onRemoveAura(index)}
                            >
                                ✦ {normalized.name || 'Item'} ({impactLabel}) ✕
                            </span>
                        )
                    })}
                </div>
            )}

            {/* Medicamento SOS */}
            <div className="section-label">MEDICAMENTO SOS</div>
            <div className="input-group mb-md">
                <input
                    type="text"
                    placeholder="Ex: Novalgina"
                    value={newSosMed}
                    onChange={(e) => setNewSosMed(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSosMed()}
                />
                <button className="btn btn-primary btn-icon" onClick={handleAddSosMed}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>

            {sosMedications.length > 0 && (
                <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                    {sosMedications.map((med, index) => (
                        <span key={index} className="badge badge-info" style={{ cursor: 'pointer' }} onClick={() => onRemoveSosMed(index)}>
                            {med} ✕
                        </span>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons" style={{ marginTop: 'var(--spacing-md)' }}>
                <button className="btn btn-secondary" onClick={onExportPDF}>
                    PDF Relatório
                </button>
                <button className="btn btn-secondary" onClick={onBackup}>
                    Backup Dados
                </button>
            </div>

            <div className="action-buttons mt-sm">
                <label className="btn btn-secondary" style={{ cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                    Restaurar Backup
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>
        </div>
    )
}

export default EventsSymptoms
