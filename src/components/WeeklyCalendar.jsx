import React from 'react'

const WeeklyCalendar = ({ currentDate, onSelectDate, daysWithData }) => {
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

    // Pegar o domingo da semana atual
    const getWeekStart = (date) => {
        const d = new Date(date)
        const day = d.getDay()
        d.setDate(d.getDate() - day)
        return d
    }

    const weekStart = getWeekStart(currentDate)

    const getDaysOfWeek = () => {
        const days = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart)
            day.setDate(weekStart.getDate() + i)
            days.push(day)
        }
        return days
    }

    const days = getDaysOfWeek()
    const today = new Date()

    const isToday = (date) => {
        return date.toDateString() === today.toDateString()
    }

    const isSelected = (date) => {
        return date.toDateString() === currentDate.toDateString()
    }

    const hasData = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        return daysWithData.includes(dateStr)
    }

    const goToPrevWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() - 7)
        onSelectDate(newDate)
    }

    const goToNextWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + 7)
        onSelectDate(newDate)
    }

    const getMonthYear = () => {
        return currentDate.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="card">
            <div className="calendar-header">
                <button className="btn btn-ghost btn-icon" onClick={goToPrevWeek}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <span className="calendar-month" style={{ textTransform: 'capitalize' }}>
                    {getMonthYear()}
                </span>
                <button className="btn btn-ghost btn-icon" onClick={goToNextWeek}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            <div className="calendar-week">
                {weekDays.map((day, index) => (
                    <div key={index} className="calendar-day-label">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-week">
                {days.map((date, index) => (
                    <button
                        key={index}
                        className={`calendar-day ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''} ${hasData(date) ? 'has-data' : ''}`}
                        onClick={() => onSelectDate(date)}
                        style={{
                            position: 'relative'
                        }}
                    >
                        {date.getDate()}
                        {/* Selected Day Indicator - White ring at top */}
                        {isSelected(date) && !isToday(date) && (
                            <span style={{
                                position: 'absolute',
                                top: '6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '6px',
                                height: '6px',
                                border: '1.5px solid #EDEDED',
                                borderRadius: '50%',
                                background: 'transparent'
                            }}></span>
                        )}
                        {/* Today Indicator - Filled white dot at top */}
                        {isToday(date) && (
                            <span style={{
                                position: 'absolute',
                                top: '6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '6px',
                                height: '6px',
                                background: '#EDEDED',
                                borderRadius: '50%'
                            }}></span>
                        )}
                        {/* Has Data Indicator - Small dot at bottom */}
                        {hasData(date) && (
                            <span style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '4px',
                                background: 'var(--color-primary)',
                                borderRadius: '50%'
                            }}></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default WeeklyCalendar
