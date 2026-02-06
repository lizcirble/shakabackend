import React from 'react';

interface FuturisticLoadingProps {
  message?: string;
}

export function FuturisticLoading({ message = "Fetching data..." }: FuturisticLoadingProps) {
  const [randomValues] = React.useState(() =>
    Array.from({ length: 12 }).map(() => ({
      height: Math.random() * 24 + 8,
      duration: 0.8 + Math.random() * 0.4,
    }))
  );

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {/* Animated circles with glow effect */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin shadow-lg shadow-primary/50"></div>
        <div 
          className="absolute inset-2 rounded-full border-2 border-transparent border-t-secondary animate-spin shadow-md shadow-secondary/30" 
          style={{ 
            animationDuration: '1.5s',
            animationDirection: 'reverse'
          }}
        ></div>
        <div 
          className="absolute inset-4 rounded-full border-2 border-transparent border-t-accent animate-spin shadow-sm shadow-accent/20" 
          style={{ animationDuration: '2s' }}
        ></div>
        
        {/* Central pulsing core */}
        <div className="absolute inset-6 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 animate-pulse"></div>
      </div>
      
      {/* Pulsing dots with wave effect */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-bounce shadow-lg"
            style={{ 
              animationDelay: `${i * 200}ms`,
              animationDuration: '1s'
            }}
          ></div>
        ))}
      </div>
      
      {/* Glowing text with typewriter effect */}
      <div className="text-center">
        <p className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-pulse">
          {message}
        </p>
        <div className="flex items-center justify-center mt-2 space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-primary rounded-full animate-ping shadow-lg shadow-primary/50"
              style={{ animationDelay: `${i * 300}ms` }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Data stream effect with enhanced animation */}
      <div className="flex space-x-1 opacity-70">
        {randomValues.map((values, i) => (
          <div
            key={i}
            className="w-0.5 bg-gradient-to-t from-transparent via-primary to-transparent animate-pulse shadow-sm shadow-primary/30"
            style={{
              height: `${values.height}px`,
              animationDelay: `${i * 80}ms`,
              animationDuration: `${values.duration}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Scanning line effect */}
      <div className="relative w-32 h-1 bg-muted/20 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse opacity-60"></div>
        <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-transparent via-secondary to-transparent animate-scan"></div>
      </div>
    </div>
  );
}
