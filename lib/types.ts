export interface Message {
  id: string;
  speaker: string;
  content: string;
  timestamp?: string;
  avatar_color: string;
}

export interface ImageMetadata {
  id: string;
  blob_url: string;
  filename: string;
  category?: string;
  sort_order: number;
  uploaded_at: string;
}

export interface MusicTrack {
  id: string;
  blob_url: string;
  title: string;
  artist: string;
  duration: number;
  sort_order: number;
  uploaded_at: string;
}

export interface UploadLog {
  id: string;
  type: 'image' | 'music' | 'transcript';
  filename: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface GameState {
  currentRoom: string;
  playerX: number;
  playerY: number;
  isLoggedIn: boolean;
}

export interface RoomConfig {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'chat' | 'gallery' | 'music' | 'hub' | 'admin';
  backgroundColor: string;
}
