const BackgroundParticles = () => {
    // Generate random dust particles
    const particles = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `-${Math.random() * 20}s`,
            animationDuration: `${10 + Math.random() * 20}s`,
            opacity: 0.1 + Math.random() * 0.3
        }
    }))

    return (
        <div className="particles-container">
            {particles.map(p => (
                <div key={p.id} className="particle" style={p.style}></div>
            ))}
            <div className="glass-overlay"></div>
        </div>
    )
}

export default BackgroundParticles
