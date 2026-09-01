const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 bg-grid-pattern bg-grid animate-grid-pulse"
        style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)' }}
      />
      
      {/* Central glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-50" />
      
      {/* Radar sweep effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        <div 
          className="absolute inset-0 animate-radar-sweep origin-center"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.1) 30deg, transparent 60deg)',
          }}
        />
      </div>
      
      {/* Pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute w-32 h-32 rounded-full border border-primary/20 animate-pulse-ring" />
        <div className="absolute w-32 h-32 rounded-full border border-primary/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-32 h-32 rounded-full border border-primary/20 animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default AnimatedGrid;
