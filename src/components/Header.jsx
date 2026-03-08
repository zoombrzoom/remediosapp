import React, { useRef } from 'react'

const Header = ({ userName, userImage, onImageChange, currentFilter, onFilterChange }) => {
    const fileInputRef = useRef(null)

    const options = [
        { value: 'weekly', label: 'Semanal' },
        { value: 'monthly', label: 'Mensal' }
    ]

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                // Compress image
                const img = new Image()
                img.src = event.target.result
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')

                    // Max dimensions
                    const MAX_WIDTH = 300
                    const MAX_HEIGHT = 300
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    ctx.drawImage(img, 0, 0, width, height)

                    // Convert to base64 with quality reduction
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
                    onImageChange(compressedBase64)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="header-card">
            <div className="avatar-container" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                {userImage ? (
                    <img src={userImage} alt={userName} className="avatar-image" />
                ) : (
                    <div className="avatar-placeholder">
                        {getInitials(userName)}
                    </div>
                )}
                <div className="avatar-ring"></div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="greeting-and-filter">
                <h1 className="greeting-text">Olá {userName.split(' ')[0]}!</h1>
                <div className="filter-dropdown">
                    <select
                        value={currentFilter}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="filter-select"
                    >
                        {options.map(filter => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="filter-arrow">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default Header
