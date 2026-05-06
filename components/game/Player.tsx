'use client';

interface PlayerProps {
  x: number;
  y: number;
  tileSize?: number;
}

export function Player({ x, y, tileSize = 32 }: PlayerProps) {
  const pixelX = x * tileSize;
  const pixelY = y * tileSize;

  return (
    <div
      className="absolute w-8 h-8 bg-primary border-2 border-accent transition-all duration-100"
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        boxShadow: '2px 2px 0px rgba(0,0,0,0.5)',
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-2 h-2 bg-dark animate-pulse" />
      </div>
    </div>
  );
}
