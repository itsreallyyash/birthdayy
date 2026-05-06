'use client';

import { useEffect, useState, useRef } from 'react';
import { MusicTrack } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function MusicRoom() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = tracks[currentTrackIdx];

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { data, error } = await supabase
          .from('music_tracks')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) throw error;

        setTracks(data || []);
      } catch (error) {
        console.error('[v0] Failed to fetch tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();

    // Subscribe to new tracks
    const channel = supabase
      .channel('music_tracks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'music_tracks' },
        (payload) => {
          const newTrack = payload.new as MusicTrack;
          setTracks((prev) => [...prev, newTrack]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.blob_url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIdx, currentTrack]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentTrackIdx < tracks.length - 1) {
      setCurrentTrackIdx(currentTrackIdx + 1);
    } else if (loop) {
      setCurrentTrackIdx(0);
    }
  };

  const handlePrev = () => {
    if (currentTrackIdx > 0) {
      setCurrentTrackIdx(currentTrackIdx - 1);
    } else if (loop) {
      setCurrentTrackIdx(tracks.length - 1);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-primary" style={{ fontFamily: "'Press Start 2P', cursive" }}>
          LOADING JUKEBOX...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto bg-gradient-to-br from-yellow-50 to-yellow-100 flex flex-col relative">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 text-5xl opacity-20">💙</div>
      <div className="absolute bottom-4 left-4 text-4xl opacity-15">🎵</div>
      
      <audio
        ref={audioRef}
        onEnded={handleNext}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary mb-4 text-center text-sm">
        🎵 JUKEBOX
      </div>

      {/* Now Playing Card */}
      {currentTrack && (
        <div className="mb-4 bg-white border-2 border-gray-400 p-4 rounded">
          <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-sm text-primary mb-3">
            NOW PLAYING
          </div>
          <div className="text-xs mb-3">
            <div className="font-bold text-foreground">{currentTrack.title}</div>
            {currentTrack.artist && (
              <div className="text-muted text-xs">{currentTrack.artist}</div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="w-full bg-gray-200 border border-gray-400 h-2 mb-1">
              <div
                className="bg-primary h-full transition-all"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="flex justify-between text-xs text-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={handlePrev}
              className="pixel-btn flex-1 text-xs"
            >
              PREV
            </button>
            <button
              onClick={handlePlayPause}
              className="pixel-btn flex-1 text-xs"
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={handleNext}
              className="pixel-btn flex-1 text-xs"
            >
              NEXT
            </button>
          </div>

          {/* Loop toggle */}
          <button
            onClick={() => setLoop(!loop)}
            className={`w-full text-xs p-2 border-2 transition-all ${
              loop
                ? 'bg-secondary text-dark border-secondary'
                : 'bg-gray-100 text-foreground border-gray-400 hover:border-primary'
            }`}
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {loop ? 'LOOP ON' : 'LOOP OFF'}
          </button>
        </div>
      )}

      {/* Playlist */}
      {tracks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted text-xs">
          <div>
            <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-muted mb-2">NO TRACKS</div>
            <p>Upload music from the admin panel</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary text-xs mb-2">
            PLAYLIST ({tracks.length})
          </div>
          <div className="space-y-1">
            {tracks.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => setCurrentTrackIdx(idx)}
                className={`w-full text-left p-2 border-2 transition-all text-xs ${
                  idx === currentTrackIdx
                    ? 'bg-primary text-dark border-primary'
                    : 'bg-white text-foreground border-gray-400 hover:border-primary'
                }`}
              >
                <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-xs">
                  {idx + 1}. {track.title}
                </div>
                {track.artist && (
                  <div className="text-muted text-xs">{track.artist}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
