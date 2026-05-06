'use client';

interface HubRoomProps {
  onRoomChange: (roomId: string) => void;
}

export function HubRoom({ onRoomChange }: HubRoomProps) {
  return (
    <div className="p-4 h-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 relative">
      {/* Sunflower photo corners */}
      <img src="/sunflower.jpg" alt="" className="absolute top-6 left-6 w-20 h-20 rounded-full object-cover opacity-30 border-2 border-yellow-400" />
      <img src="/sunflower.jpg" alt="" className="absolute bottom-10 right-6 w-16 h-16 rounded-full object-cover opacity-25 border-2 border-yellow-400" />
      <div className="absolute top-1/4 right-20 text-5xl opacity-15">💙</div>
      
      <div className="pixel-card text-center max-w-md relative z-10">
        <h1 style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-2xl text-primary mb-2">
          VI X YASH
        </h1>
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-xs text-accent mb-4">
          ★ HUB ★
        </div>
        <p className="text-xs text-foreground mb-6 leading-relaxed">
          Welcome to your personal memory space. Explore rooms to discover conversations,
          view memories, and listen to music. I know you dont like surprises but i made this for you.
          Hope you like it!!
        </p>

        <div className="space-y-2 mb-6">
          <button
            onClick={() => onRoomChange('chat')}
            className="pixel-btn w-full text-xs"
          >
            INITIAL CHATS
          </button>
          <button
            onClick={() => onRoomChange('gallery')}
            className="pixel-btn w-full text-xs"
          >
            MEMORY GALLERY
          </button>
          <button
            onClick={() => onRoomChange('music')}
            className="pixel-btn w-full text-xs"
          >
            JUKEBOX
          </button>
        </div>

        <div className="text-xs text-muted border-t border-gray-400 pt-4 space-y-3">
          <div>
            <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary mb-2 text-xs">CONTROLS</div>
            <div className="text-muted space-y-1">
              <div>↑↓←→ Arrow Keys or WASD to move</div>
              <div>Click room buttons to teleport instantly</div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary text-xs mb-1">NAVIGATION</div>
            <div className="text-muted text-xs">
              You can switch between rooms anytime using the room selector at the bottom
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
