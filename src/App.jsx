import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Header from './components/Header'
import ProgressChart from './components/ProgressChart'
import HealthGauge from './components/HealthGauge'
import MedicationCard from './components/MedicationCard'
import DailyControls from './components/DailyControls'
import EventsSymptoms from './components/EventsSymptoms'
import WeeklyCalendar from './components/WeeklyCalendar'
import HistoryModal from './components/HistoryModal'
import BackgroundParticles from './components/BackgroundParticles'
import { useLocalStorage } from './hooks/useLocalStorage'
import { initAuth, saveUserData, getUserData, subscribeToUserData, getSharedDataDocId } from './firebase'

// Estrutura inicial dos dados
const getDefaultDayData = () => ({
    medications: {
        afternoon: { taken: false, items: [] },
        midnight: { taken: false, items: [] },
        weekly: { taken: false, items: [] }
    },
    controls: {
        corticoide: 0,
        bathroom: 0,
        pain: 0
    },
    events: [],
    symptoms: [],
    sosMedications: []
})

const App = () => {
    // Estado principal
    const [userName] = useState('David')
    const [userImage, setUserImage] = useLocalStorage('userImage', null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentFilter, setCurrentFilter] = useState('weekly')
    const [showMedsModal, setShowMedsModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)

    // Firebase Auth State
    const [firebaseUser, setFirebaseUser] = useState(null)
    const [sharedDocId] = useState(() => getSharedDataDocId())
    const isApplyingCloudDataRef = useRef(false)
    const cloudReadyRef = useRef(false)
    const lastPushedSignatureRef = useRef('')
    const autoSaveTimeoutRef = useRef(null)

    // Lista global de medicamentos (persiste em todos os dias)
    const [medications, setMedications] = useLocalStorage('medications', [])

    // Dados diários persistidos
    const [allData, setAllData] = useLocalStorage('healthData', {})

    // Firebase Auth - Initialize on mount
    useEffect(() => {
        const unsubscribe = initAuth((user) => {
            setFirebaseUser(user)
            console.log('Firebase Auth: User logged in', user.uid)
        })
        return () => unsubscribe && unsubscribe()
    }, [])

    const applyCloudData = useCallback((data) => {
        if (!data) return

        isApplyingCloudDataRef.current = true

        const cloudSignature = JSON.stringify({
            allData: data.allData || {},
            medications: data.medications || [],
            userImage: data.userImage || null
        })
        lastPushedSignatureRef.current = cloudSignature

        if (data.allData && typeof data.allData === 'object') {
            setAllData(prev => {
                const merged = { ...prev }
                Object.entries(data.allData).forEach(([key, val]) => {
                    const cloudTime = new Date(val?.updatedAt || 0).getTime()
                    const localTime = new Date(merged[key]?.updatedAt || 0).getTime()
                    if (cloudTime >= localTime || !merged[key]) {
                        merged[key] = val
                    }
                })
                return merged
            })
        }
        if (Array.isArray(data.medications)) {
            setMedications(data.medications)
        }
        if (data.userImage !== undefined) {
            setUserImage(data.userImage)
        }

        setTimeout(() => {
            isApplyingCloudDataRef.current = false
            cloudReadyRef.current = true
        }, 150)
    }, [setAllData, setMedications, setUserImage])

    // Initial fetch + real-time listener from Firebase
    useEffect(() => {
        if (!firebaseUser || !sharedDocId) return

        let unsubscribe = null

        const bootstrap = async () => {
            try {
                const initialData = await getUserData(sharedDocId)
                if (initialData) {
                    applyCloudData(initialData)
                    console.log('Firebase: Initial data loaded from cloud')
                } else {
                    cloudReadyRef.current = true
                    console.log('Firebase: No cloud data found, using local')
                }
            } catch (err) {
                console.error('Firebase: Initial fetch failed', err)
                cloudReadyRef.current = true
            }

            unsubscribe = subscribeToUserData(sharedDocId, (data) => {
                if (!data) return
                applyCloudData(data)
                console.log('Firebase: Real-time update received')
            })
        }

        bootstrap()

        return () => unsubscribe && unsubscribe()
    }, [firebaseUser, sharedDocId, applyCloudData])

    // Auto-upload local changes to Firebase (only after first cloud read)
    useEffect(() => {
        if (!firebaseUser || !sharedDocId) return
        if (!cloudReadyRef.current) return
        if (isApplyingCloudDataRef.current) return

        const payload = {
            allData,
            medications,
            userName,
            userImage
        }
        const payloadSignature = JSON.stringify({
            allData,
            medications,
            userImage
        })

        if (payloadSignature === lastPushedSignatureRef.current) return

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current)
        }

        autoSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await saveUserData(sharedDocId, payload)
                lastPushedSignatureRef.current = payloadSignature
                console.log('Firebase: Data pushed to cloud')
            } catch (error) {
                console.error('Auto-sync error:', error)
            }
        }, 1000)

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [firebaseUser, sharedDocId, allData, medications, userName, userImage])

    // Obter chave da data atual (usando timezone local, não UTC)
    const getDateKey = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    const dateKey = getDateKey(currentDate)

    // Dados do dia atual
    const dayData = allData[dateKey] || getDefaultDayData()

    // Calcular dados históricos para gráficos
    const getHistoricalData = useMemo(() => {
        const getDateRange = (days) => {
            const result = []
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(currentDate)
                date.setDate(date.getDate() - i)
                const key = getDateKey(date)
                const dayInfo = allData[key] || getDefaultDayData()

                // Calculate daily wellness score for the history chart
                // Formula: 70% Well-being slider + 10% Symptoms + 10% Meds + 10% Stability
                const rawSymptoms = dayInfo.symptoms || []
                const normalizedSymptoms = rawSymptoms.map(s =>
                    typeof s === 'string'
                        ? { name: s, impact: 1 }
                        : s || {}
                )
                const totalSymptomImpactUnits = normalizedSymptoms.reduce(
                    (total, s) => total + (typeof s.impact === 'number' ? s.impact : 1),
                    0
                )

                const events = dayInfo.events || []
                const medTakenCount = [
                    dayInfo.medications?.afternoon?.taken,
                    dayInfo.medications?.midnight?.taken,
                    dayInfo.medications?.weekly?.taken
                ].filter(Boolean).length

                const medP = (medTakenCount / 3) * 10

                // Automated Wellness Calculation (70% portion)
                // Base 100 - Pain*5 - BodyPain*4 - Fatigue*4 - Bathroom*3 - SymptomImpact*2
                const autoWellness = Math.max(
                    0,
                    100
                    - ((dayInfo.controls?.pain || 0) * 5)
                    - ((dayInfo.controls?.bodyPain || 0) * 4)
                    - ((dayInfo.controls?.fatigue || 0) * 4)
                    - ((dayInfo.controls?.bathroom || 0) * 3)
                    - (totalSymptomImpactUnits * 2)
                )
                const wellnessP = (autoWellness / 100) * 70

                const symptomP = Math.max(0, 10 - (totalSymptomImpactUnits * 2))
                const stabilityP = events.length > 0 ? 0 : 10

                const dailyScore = Math.round(medP + wellnessP + symptomP + stabilityP)

                result.push({
                    label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
                    fullDate: date.toLocaleDateString('pt-BR'),
                    value: dailyScore,
                    corticoide: dayInfo.controls?.corticoide || 0,
                    bathroom: dayInfo.controls?.bathroom || 0,
                    pain: dayInfo.controls?.pain || 0
                })
            }
            return result
        }

        const rangeDays = currentFilter === 'monthly' ? 30 : 7

        return {
            weekly: getDateRange(7),
            monthly: getDateRange(30),
            // Legacy arrays for ProgressChart components - now synced with filter
            corticoide: getDateRange(rangeDays).map(d => d.corticoide),
            bathroom: getDateRange(rangeDays).map(d => d.bathroom),
            pain: getDateRange(rangeDays).map(d => d.pain)
        }
    }, [allData, currentDate, currentFilter])

    // Calcular tendência
    const calculateTrend = (dataArray) => {
        if (dataArray.length < 2) return 0
        const recent = dataArray.slice(-3).reduce((a, b) => a + b, 0) / 3
        const older = dataArray.slice(0, 3).reduce((a, b) => a + b, 0) / 3
        if (older === 0) return 0
        return Math.round(((recent - older) / older) * 100)
    }

    // Atualizar dados do dia
    const updateDayData = useCallback((updates) => {
        setAllData(prev => ({
            ...prev,
            [dateKey]: {
                ...getDefaultDayData(),
                ...prev[dateKey],
                ...updates,
                updatedAt: new Date().toISOString()
            }
        }))
    }, [dateKey, setAllData])

    // Handlers para medicamentos
    const handleToggleMedTaken = (timeSlot) => {
        updateDayData({
            medications: {
                ...dayData.medications,
                [timeSlot]: {
                    ...dayData.medications[timeSlot],
                    taken: !dayData.medications[timeSlot]?.taken
                }
            }
        })
    }

    const handleResetMed = (timeSlot) => {
        const currentMedications = dayData.medications || getDefaultDayData().medications
        updateDayData({
            medications: {
                ...currentMedications,
                [timeSlot]: {
                    ...currentMedications[timeSlot],
                    taken: false
                }
            }
        })
    }

    // Handlers para controles diários
    const handleControlChange = (controlId, value) => {
        const currentControls = dayData.controls || getDefaultDayData().controls
        updateDayData({
            controls: {
                ...currentControls,
                [controlId]: value
            }
        })
    }

    // Handlers para eventos
    const handleToggleEvent = (eventId) => {
        const events = dayData.events || []
        const newEvents = events.includes(eventId)
            ? events.filter(e => e !== eventId)
            : [...events, eventId]
        updateDayData({ events: newEvents })
    }

    // Handlers para sintomas
    const handleAddSymptom = (symptom) => {
        const currentSymptoms = dayData.symptoms || []
        updateDayData({ symptoms: [...currentSymptoms, symptom] })
    }

    const handleRemoveSymptom = (index) => {
        const symptoms = [...(dayData.symptoms || [])]
        symptoms.splice(index, 1)
        updateDayData({ symptoms })
    }

    // Handlers para medicamentos SOS
    const handleAddSosMed = (med) => {
        const sosMedications = dayData.sosMedications || []
        updateDayData({ sosMedications: [...sosMedications, med] })
    }

    const handleRemoveSosMed = (index) => {
        const sosMedications = [...(dayData.sosMedications || [])]
        sosMedications.splice(index, 1)
        updateDayData({ sosMedications })
    }

    // Analisar sintomas (mock)
    const handleAnalyze = () => {
        const rawSymptoms = dayData.symptoms || []
        const normalizedSymptoms = rawSymptoms.map(s =>
            typeof s === 'string'
                ? { name: s, impact: 1 }
                : s || {}
        )
        const symptomNames = normalizedSymptoms
            .map(s => s.name)
            .filter(Boolean)
        const pain = dayData.controls?.pain || 0

        let message = '📊 Análise dos Sintomas:\n\n'

        if (normalizedSymptoms.length === 0 && pain === 0) {
            message += '✅ Nenhum sintoma registrado hoje. Continue assim!'
        } else {
            if (pain > 7) {
                message += '⚠️ Nível de dor elevado. Considere consultar um médico.\n'
            }
            if (normalizedSymptoms.length > 3) {
                message += '⚠️ Múltiplos sintomas registrados. Monitore a evolução.\n'
            }
            message += `\nSintomas: ${symptomNames.join(', ') || 'Nenhum'}\nNível de dor: ${pain}/10`
        }

        alert(message)
    }

    // Export PDF - Relatório mensal completo
    const handleExportPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF()

            const month = currentDate.getMonth()
            const year = currentDate.getFullYear()
            const daysInMonth = new Date(year, month + 1, 0).getDate()
            const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

            const allDaysOfMonth = []
            for (let d = 1; d <= daysInMonth; d++) {
                const dt = new Date(year, month, d)
                const key = getDateKey(dt)
                const info = allData[key] || getDefaultDayData()
                allDaysOfMonth.push({ date: dt, key, ...info })
            }

            const daysWithActivity = allDaysOfMonth.filter(d =>
                (d.symptoms?.length > 0) ||
                (d.events?.length > 0) ||
                (d.sosMedications?.length > 0) ||
                (d.controls?.pain > 0) ||
                (d.controls?.bathroom > 0) ||
                (d.controls?.corticoide > 0) ||
                d.medications?.afternoon?.taken ||
                d.medications?.midnight?.taken ||
                d.medications?.weekly?.taken
            )

            const eventLabelMap = { imuno: 'Imunobiológico', ps: 'PS', inter: 'Internação' }
            const impactLabelMap = { 1: 'leve', 2: 'moderado', 3: 'intenso' }

            const calcDayScore = (info) => {
                const rawSymptoms = info.symptoms || []
                const totalImpact = rawSymptoms.reduce((t, s) => {
                    const imp = typeof s === 'string' ? 1 : (s?.impact || 1)
                    return t + imp
                }, 0)
                const events = info.events || []
                const eventPenalties = { inter: 10, ps: 8, imuno: 4 }
                const medsTaken = [
                    info.medications?.afternoon?.taken,
                    info.medications?.midnight?.taken,
                    info.medications?.weekly?.taken
                ].filter(Boolean).length
                const medP = (medsTaken / 3) * 10
                const wellness = Math.max(0, 100 - ((info.controls?.pain || 0) * 5) - ((info.controls?.bodyPain || 0) * 4) - ((info.controls?.fatigue || 0) * 4) - ((info.controls?.bathroom || 0) * 3) - (totalImpact * 2))
                const wellP = (wellness / 100) * 70
                const symptomP = Math.max(0, 10 - (totalImpact * 2))
                const eventPen = events.reduce((t, e) => t + (eventPenalties[e] || 0), 0)
                const stabilityP = Math.max(0, 10 - eventPen)
                return Math.round(wellP + symptomP + medP + stabilityP)
            }

            const scores = daysWithActivity.map(d => calcDayScore(d))
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
            const bestScore = scores.length > 0 ? Math.max(...scores) : 0
            const worstScore = scores.length > 0 ? Math.min(...scores) : 0

            const allSymptomNames = new Map()
            const allEventCounts = {}
            let totalCorticoide = 0
            let totalBathroom = 0
            let totalPain = 0
            let painDays = 0
            let totalBodyPain = 0
            let bodyPainDays = 0
            let totalFatigue = 0
            let fatigueDays = 0
            const allSosMeds = new Map()

            daysWithActivity.forEach(d => {
                (d.symptoms || []).forEach(s => {
                    const name = typeof s === 'string' ? s : (s?.name || '')
                    if (name) allSymptomNames.set(name, (allSymptomNames.get(name) || 0) + 1)
                });
                (d.events || []).forEach(e => {
                    const label = eventLabelMap[e] || e
                    allEventCounts[label] = (allEventCounts[label] || 0) + 1
                });
                (d.sosMedications || []).forEach(m => {
                    allSosMeds.set(m, (allSosMeds.get(m) || 0) + 1)
                })
                totalCorticoide += (d.controls?.corticoide || 0)
                totalBathroom += (d.controls?.bathroom || 0)
                if ((d.controls?.pain || 0) > 0) { totalPain += d.controls.pain; painDays++ }
                totalBodyPain += (d.controls?.bodyPain || 0)
                totalFatigue += (d.controls?.fatigue || 0)
                if ((d.controls?.bodyPain || 0) > 0) bodyPainDays++
                if ((d.controls?.fatigue || 0) > 0) fatigueDays++
            })

            const blue = [59, 130, 246]
            const dark = [30, 30, 35]
            const white = [255, 255, 255]
            const grey = [160, 160, 168]
            const lightGrey = [120, 120, 130]

            let y = 20
            const pageW = 210
            const marginL = 20
            const marginR = 190
            const lineH = 7

            const checkPage = (needed = 20) => {
                if (y + needed > 275) {
                    doc.setFontSize(8)
                    doc.setTextColor(...grey)
                    doc.text(`Controle de Saúde — ${monthName}`, marginL, 290)
                    doc.text(`${doc.getNumberOfPages()}`, marginR, 290, { align: 'right' })
                    doc.addPage()
                    y = 20
                }
            }

            const drawSection = (title) => {
                checkPage(25)
                doc.setFillColor(...blue)
                doc.roundedRect(marginL, y - 5, 170, 9, 2, 2, 'F')
                doc.setFontSize(11)
                doc.setTextColor(...white)
                doc.text(title, marginL + 4, y + 1.5)
                y += 12
            }

            // ===== CAPA =====
            doc.setFillColor(...dark)
            doc.rect(0, 0, pageW, 297, 'F')

            doc.setFontSize(28)
            doc.setTextColor(...white)
            doc.text('Relatório de Saúde', marginL, 50)

            doc.setFontSize(14)
            doc.setTextColor(...blue)
            doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), marginL, 62)

            doc.setFontSize(11)
            doc.setTextColor(...grey)
            doc.text(`Paciente: ${userName}`, marginL, 78)
            doc.text(`Dias registrados: ${daysWithActivity.length} de ${daysInMonth}`, marginL, 86)
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, marginL, 94)

            doc.setDrawColor(...blue)
            doc.setLineWidth(0.5)
            doc.line(marginL, 102, marginR, 102)

            // Resumo na capa
            doc.setFontSize(16)
            doc.setTextColor(...white)
            doc.text('Resumo do Mês', marginL, 118)

            const summaryItems = [
                ['Score Médio', `${avgScore}%`],
                ['Melhor Dia', `${bestScore}%`],
                ['Pior Dia', `${worstScore}%`],
                ['Corticoide Total', `${totalCorticoide} mg`],
                ['Média Banheiro/dia', daysWithActivity.length > 0 ? `${(totalBathroom / daysWithActivity.length).toFixed(1)}` : '0'],
                ['Média Dor', painDays > 0 ? `${(totalPain / painDays).toFixed(1)}/10` : 'Sem dor registrada'],
                ['Média Dor no Corpo', bodyPainDays > 0 ? `${(totalBodyPain / bodyPainDays).toFixed(1)}/10` : 'Sem registro'],
                ['Média Cansaço', fatigueDays > 0 ? `${(totalFatigue / fatigueDays).toFixed(1)}/10` : 'Sem registro'],
                ['Sintomas Distintos', `${allSymptomNames.size}`],
                ['Eventos', Object.keys(allEventCounts).length > 0 ? Object.entries(allEventCounts).map(([k, v]) => `${k} (${v}x)`).join(', ') : 'Nenhum'],
                ['Medicamentos SOS', allSosMeds.size > 0 ? [...allSosMeds.entries()].map(([k, v]) => `${k} (${v}x)`).join(', ') : 'Nenhum']
            ]

            y = 128
            doc.setFontSize(10)
            summaryItems.forEach(([label, value]) => {
                doc.setTextColor(...grey)
                doc.text(label, marginL + 4, y)
                doc.setTextColor(...white)
                doc.text(value, marginR - 4, y, { align: 'right' })
                y += lineH + 1
            })

            if (allSymptomNames.size > 0) {
                y += 6
                doc.setFontSize(12)
                doc.setTextColor(...white)
                doc.text('Sintomas Mais Frequentes', marginL, y)
                y += 8
                doc.setFontSize(10)
                const sorted = [...allSymptomNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
                sorted.forEach(([name, count]) => {
                    doc.setTextColor(...grey)
                    doc.text(`${name}`, marginL + 4, y)
                    doc.setTextColor(...blue)
                    doc.text(`${count}x`, marginR - 4, y, { align: 'right' })
                    y += lineH
                })
            }

            doc.setFontSize(8)
            doc.setTextColor(...grey)
            doc.text(`Controle de Saúde — ${monthName}`, marginL, 290)
            doc.text('1', marginR, 290, { align: 'right' })

            // ===== PÁGINAS DIÁRIAS =====
            daysWithActivity.forEach((dayInfo) => {
                doc.addPage()
                doc.setFillColor(...dark)
                doc.rect(0, 0, pageW, 297, 'F')
                y = 20

                const dayLabel = dayInfo.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                const score = calcDayScore(dayInfo)

                doc.setFontSize(14)
                doc.setTextColor(...white)
                doc.text(dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1), marginL, y)
                y += 6

                doc.setFontSize(20)
                doc.setTextColor(...blue)
                doc.text(`${score}%`, marginR, y - 6, { align: 'right' })

                doc.setDrawColor(50, 50, 55)
                doc.line(marginL, y + 2, marginR, y + 2)
                y += 12

                // Status de Saúde
                drawSection('Status de Saúde')
                doc.setFontSize(10)
                doc.setTextColor(...grey)
                doc.text(`Score do dia: ${score}%`, marginL + 4, y); y += lineH
                doc.text(`Corticoide: ${dayInfo.controls?.corticoide || 0} mg`, marginL + 4, y); y += lineH
                doc.text(`Idas ao Banheiro: ${dayInfo.controls?.bathroom || 0}`, marginL + 4, y); y += lineH
                doc.text(`Nível de Dor: ${dayInfo.controls?.pain || 0}/10`, marginL + 4, y); y += lineH
                doc.text(`Dor no Corpo: ${dayInfo.controls?.bodyPain || 0}/10`, marginL + 4, y); y += lineH
                doc.text(`Cansaço: ${dayInfo.controls?.fatigue || 0}/10`, marginL + 4, y); y += lineH + 4

                // Medicamentos
                drawSection('Medicamentos')
                doc.setFontSize(10)
                const scheduleLabels = { afternoon: '14:00h', midnight: 'Meia-noite', weekly: 'Semanal/Outros' }
                Object.entries(scheduleLabels).forEach(([schedId, schedLabel]) => {
                    checkPage(16)
                    const taken = dayInfo.medications?.[schedId]?.taken
                    const medsForSched = medications.filter(m => m.schedule === schedId)
                    const statusText = taken ? 'TOMADO' : 'Não tomado'
                    doc.setTextColor(...white)
                    doc.text(`${schedLabel}:`, marginL + 4, y)
                    doc.setTextColor(taken ? 34 : 160, taken ? 197 : 160, taken ? 94 : 168)
                    doc.text(statusText, marginL + 45, y)
                    y += lineH
                    if (medsForSched.length > 0) {
                        doc.setTextColor(...lightGrey)
                        const medNames = medsForSched.map(m => `${m.name}${m.dosage ? ' (' + m.dosage + ')' : ''}`).join(', ')
                        const lines = doc.splitTextToSize(medNames, 155)
                        lines.forEach(line => { checkPage(); doc.text(line, marginL + 8, y); y += lineH - 1 })
                    }
                    y += 2
                })
                y += 2

                // Sintomas
                const rawSymptoms = dayInfo.symptoms || []
                if (rawSymptoms.length > 0) {
                    drawSection('Sintomas')
                    doc.setFontSize(10)
                    rawSymptoms.forEach(s => {
                        checkPage()
                        const name = typeof s === 'string' ? s : (s?.name || 'Sintoma')
                        const impact = typeof s === 'string' ? 1 : (s?.impact || 1)
                        doc.setTextColor(...white)
                        doc.text(`• ${name}`, marginL + 4, y)
                        doc.setTextColor(...grey)
                        doc.text(`(${impactLabelMap[impact] || 'moderado'})`, marginL + 4 + doc.getTextWidth(`• ${name} `), y)
                        y += lineH
                    })
                    y += 4
                }

                // Eventos
                const evts = dayInfo.events || []
                if (evts.length > 0) {
                    drawSection('Eventos')
                    doc.setFontSize(10)
                    evts.forEach(e => {
                        checkPage()
                        doc.setTextColor(...white)
                        doc.text(`• ${eventLabelMap[e] || e}`, marginL + 4, y)
                        y += lineH
                    })
                    y += 4
                }

                // SOS
                const sos = dayInfo.sosMedications || []
                if (sos.length > 0) {
                    drawSection('Medicamentos SOS')
                    doc.setFontSize(10)
                    sos.forEach(m => {
                        checkPage()
                        doc.setTextColor(...white)
                        doc.text(`• ${m}`, marginL + 4, y)
                        y += lineH
                    })
                    y += 4
                }

                // Footer
                doc.setFontSize(8)
                doc.setTextColor(...grey)
                doc.text(`Controle de Saúde — ${monthName}`, marginL, 290)
                doc.text(`${doc.getNumberOfPages()}`, marginR, 290, { align: 'right' })
            })

            if (daysWithActivity.length === 0) {
                doc.addPage()
                doc.setFillColor(...dark)
                doc.rect(0, 0, pageW, 297, 'F')
                doc.setFontSize(14)
                doc.setTextColor(...grey)
                doc.text('Nenhum dado registrado neste mês.', marginL, 50)
            }

            const fileMonth = String(month + 1).padStart(2, '0')
            doc.save(`relatorio_saude_${year}-${fileMonth}.pdf`)
        } catch (error) {
            console.error('PDF Error:', error)
            alert('Erro ao gerar PDF')
        }
    }

    // Backup
    const handleBackup = () => {
        const backupData = {
            allData,
            medications,
            userName,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        }
        const json = JSON.stringify(backupData, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_saude_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        alert('Backup criado com sucesso!')
    }

    const handleRestore = (data) => {
        if (data && typeof data === 'object') {
            setAllData(data)
            alert('Dados restaurados com sucesso!')
        }
    }

    // Dias com dados
    const daysWithData = Object.keys(allData).filter(key => {
        const data = allData[key]
        return data && (
            data.symptoms?.length > 0 ||
            data.events?.length > 0 ||
            data.sosMedications?.length > 0 ||
            data.controls?.pain > 0 ||
            data.medications?.afternoon?.taken ||
            data.medications?.midnight?.taken ||
            data.medications?.weekly?.taken
        )
    })

    // Calcular medicamentos tomados
    const medicationsTaken = [
        dayData.medications?.afternoon?.taken,
        dayData.medications?.midnight?.taken,
        dayData.medications?.weekly?.taken
    ].filter(Boolean).length

    return (
        <div className="app-container">
            <BackgroundParticles />
            <HistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                historyData={{
                    weekly: getHistoricalData.weekly,
                    monthly: getHistoricalData.monthly
                }}
            />
            <main className="main-content">
                {/* Header + Gráficos de Progresso na mesma linha */}
                <div className="progress-charts-row">
                    <Header
                        userName={userName}
                        userImage={userImage}
                        onImageChange={setUserImage}
                        currentFilter={currentFilter}
                        onFilterChange={setCurrentFilter}
                    />
                    <ProgressChart
                        title="Corticoide"
                        value={dayData.controls?.corticoide || 0}
                        maxValue={100}
                        unit="mg"
                        weeklyData={getHistoricalData.corticoide}
                        trend={calculateTrend(getHistoricalData.corticoide)}
                    />
                    <ProgressChart
                        title="Idas ao Banheiro"
                        value={dayData.controls?.bathroom || 0}
                        maxValue={20}
                        unit=""
                        weeklyData={getHistoricalData.bathroom}
                        trend={calculateTrend(getHistoricalData.bathroom)}
                    />
                    <ProgressChart
                        title="Nível de Dor"
                        value={dayData.controls?.pain || 0}
                        maxValue={10}
                        unit="/10"
                        weeklyData={getHistoricalData.pain}
                        trend={calculateTrend(getHistoricalData.pain)}
                    />
                </div>

                <div className="dashboard-grid">
                    {/* Coluna Esquerda */}
                    <div className="flex flex-col gap-md">
                        <HealthGauge
                            medicationsTaken={medicationsTaken}
                            totalMedications={3}
                            symptoms={dayData.symptoms || []}
                            bathroomLevel={dayData.controls?.bathroom || 0}
                            painLevel={dayData.controls?.pain || 0}
                            bodyPainLevel={dayData.controls?.bodyPain || 0}
                            fatigueLevel={dayData.controls?.fatigue || 0}
                            events={dayData.events || []}
                            onExpand={() => setShowHistoryModal(true)}
                        />

                        <MedicationCard
                            medications={medications}
                            dayMedications={dayData.medications}
                            onToggleTaken={handleToggleMedTaken}
                            onReset={handleResetMed}
                            onAddMedication={(med) => setMedications([...medications, med])}
                            onEditMedication={(id, updates) => setMedications(medications.map(m => m.id === id ? { ...m, ...updates } : m))}
                            onDeleteMedication={(id) => setMedications(medications.filter(m => m.id !== id))}
                        />

                        <DailyControls
                            controls={dayData.controls || {}}
                            onControlChange={handleControlChange}
                        />
                    </div>

                    {/* Coluna Direita */}
                    <div className="flex flex-col gap-md">
                        <WeeklyCalendar
                            currentDate={currentDate}
                            onSelectDate={setCurrentDate}
                            daysWithData={daysWithData}
                        />

                        <EventsSymptoms
                            events={dayData.events || []}
                            symptoms={dayData.symptoms || []}
                            sosMedications={dayData.sosMedications || []}
                            onToggleEvent={handleToggleEvent}
                            onAddSymptom={handleAddSymptom}
                            onAddSosMed={handleAddSosMed}
                            onRemoveSymptom={handleRemoveSymptom}
                            onRemoveSosMed={handleRemoveSosMed}
                            onAnalyze={handleAnalyze}
                            onExportPDF={handleExportPDF}
                            onBackup={handleBackup}
                            onRestore={handleRestore}
                        />
                    </div>
                </div>
            </main>

            {/* Modal Gerenciar Medicamentos */}
            {showMedsModal && (
                <div className="modal-overlay" onClick={() => setShowMedsModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Gerenciar Medicamentos</h2>
                            <button className="modal-close" onClick={() => setShowMedsModal(false)}>
                                ×
                            </button>
                        </div>

                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                            Configure seus medicamentos por horário. Clique nos cards na tela principal para marcar como tomado.
                        </p>

                        <div className="flex flex-col gap-md">
                            <div className="card" style={{ background: 'var(--color-bg-dark)' }}>
                                <strong>14:00h</strong>
                                <p className="text-muted mt-sm">Medicamentos do período da tarde</p>
                            </div>

                            <div className="card" style={{ background: 'var(--color-bg-dark)' }}>
                                <strong>Meia-noite</strong>
                                <p className="text-muted mt-sm">Medicamentos noturnos</p>
                            </div>

                            <div className="card" style={{ background: 'var(--color-bg-dark)' }}>
                                <strong className="text-primary">Semanal / Outros</strong>
                                <p className="text-muted mt-sm">Medicamentos de uso não diário</p>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg mt-lg"
                            style={{ width: '100%' }}
                            onClick={() => setShowMedsModal(false)}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
