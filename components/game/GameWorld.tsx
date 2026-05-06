'use client';

import { useState, useCallback, useEffect } from 'react';
import { RoomConfig } from '@/lib/types';
import { Room } from './Room';

const ROOMS: RoomConfig[] = [
  {
    id: 'hub',
    name: 'Main Hub',
    description: 'Welcome to VI X YASH',
    x: 0,
    y: 0,
    width: 20,
    height: 16,
    type: 'hub',
    backgroundColor: '#1a1a2e',
  },
  {
    id: 'chat',
    name: 'Chat Room',
    description: 'Initial Conversations',
    x: 20,
    y: 0,
    width: 20,
    height: 16,
    type: 'chat',
    backgroundColor: '#0f1b3c',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Memory Gallery',
    x: 0,
    y: 16,
    width: 20,
    height: 16,
    type: 'gallery',
    backgroundColor: '#2d1b4e',
  },
  {
    id: 'music',
    name: 'Music Room',
    description: 'Jukebox',
    x: 20,
    y: 16,
    width: 20,
    height: 16,
    type: 'music',
    backgroundColor: '#1b3c4e',
  },
];

export function GameWorld() {
  const [currentRoom, setCurrentRoom] = useState<string>('hub');
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 8 });

  const handleRoomChange = useCallback((roomId: string) => {
    setCurrentRoom(roomId);
    setPlayerPos({ x: 10, y: 8 });
  }, []);

  const room = ROOMS.find((r) => r.id === currentRoom) || ROOMS[0];

  return (
    <div className="flex-1 overflow-hidden bg-yellow-100 flex flex-col">
      {/* Room header */}
      <div className="bg-dark border-b-2 border-gray-400 p-4 flex justify-between items-center">
        <div>
          <h2 style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-lg text-primary">{room.name}</h2>
          <p className="text-xs text-muted mt-1">{room.description}</p>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-xs text-muted text-right">
          <div>X: {Math.round(playerPos.x)}</div>
          <div>Y: {Math.round(playerPos.y)}</div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-yellow-50 to-yellow-100">
        <Room
          room={room}
          playerPos={playerPos}
          onPlayerMove={setPlayerPos}
          onRoomChange={handleRoomChange}
        />
      </div>

      {/* Room list and controls */}
      <div className="bg-dark border-t-2 border-gray-400 p-3 text-xs text-muted space-y-2">
        <div className="flex justify-between items-center mb-2">
          <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary">ROOMS</div>
          <div className="text-muted">Use WASD or arrow keys to move</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRoomChange(r.id)}
              style={{ fontFamily: "'Press Start 2P', cursive" }}
              className={`px-2 py-1 border-2 transition-all text-xs ${
                currentRoom === r.id
                  ? 'bg-primary text-dark border-primary'
                  : 'bg-gray-100 text-foreground border-gray-400 hover:border-primary'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
