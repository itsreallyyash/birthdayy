'use client';

import { useEffect, useRef } from 'react';
import { RoomConfig } from '@/lib/types';
import { ChatRoom } from '@/components/game/rooms/ChatRoom';
import { GalleryRoom } from '@/components/game/rooms/GalleryRoom';
import { MusicRoom } from '@/components/game/rooms/MusicRoom';
import { HubRoom } from '@/components/game/rooms/HubRoom';
import { Player } from './Player';

interface RoomProps {
  room: RoomConfig;
  playerPos: { x: number; y: number };
  onPlayerMove: (pos: { x: number; y: number }) => void;
  onRoomChange: (roomId: string) => void;
}

const TILE_SIZE = 32; // pixels per tile
const GRID_WIDTH = 40; // tiles
const GRID_HEIGHT = 32; // tiles

export function Room({
  room,
  playerPos,
  onPlayerMove,
  onRoomChange,
}: RoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle keyboard input for player movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 1;
      let newPos = { ...playerPos };

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          newPos.y = Math.max(0, playerPos.y - speed);
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          newPos.y = Math.min(room.height - 1, playerPos.y + speed);
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'a':
          newPos.x = Math.max(0, playerPos.x - speed);
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          newPos.x = Math.min(room.width - 1, playerPos.x + speed);
          e.preventDefault();
          break;
        default:
          return;
      }

      onPlayerMove(newPos);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, room, onPlayerMove]);

  // Render room specific content
  const renderRoomContent = () => {
    switch (room.type) {
      case 'chat':
        return <ChatRoom />;
      case 'gallery':
        return <GalleryRoom />;
      case 'music':
        return <MusicRoom />;
      case 'hub':
        return <HubRoom onRoomChange={onRoomChange} />;
      case 'admin':
        return <div className="p-4 text-center text-gray-400">Admin Room</div>;
      default:
        return <div className="p-4 text-center text-gray-400">Empty Room</div>;
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(100, 100, 100, .1) 25%, rgba(100, 100, 100, .1) 26%, transparent 27%, transparent 74%, rgba(100, 100, 100, .1) 75%, rgba(100, 100, 100, .1) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(100, 100, 100, .1) 25%, rgba(100, 100, 100, .1) 26%, transparent 27%, transparent 74%, rgba(100, 100, 100, .1) 75%, rgba(100, 100, 100, .1) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Room content */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {renderRoomContent()}
      </div>
    </div>
  );
}
