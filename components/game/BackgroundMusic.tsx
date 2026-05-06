'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MusicTrack } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function BackgroundMusic() {
  const [tracks, setTracks]       = useState<MusicTrack[]>([]);
  const [current, setCurrent]     = useState<MusicTrack | null>(null);
  const [muted, setMuted]         = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const audioRef                  = useRef<HTMLAudioElement>(null);
  const popupTimer                = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startedRef                = useRef(false);
  const tracksRef                 = useRef<MusicTrack[]>([]);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);

  useEffect(() => {
    supabase.from('music_tracks').select('*').order('sort_order').then(({ data }) => {
      setTracks(data || []);
    });
  }, []);

  const playRandom = useCallback((list: MusicTrack[]) => {
    if (!list.length || !audioRef.current) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    setCurrent(pick);
    audioRef.current.src    = pick.blob_url;
    audioRef.current.volume = 0.3;
    audioRef.current.play().catch(() => {});
    setShowPopup(true);
    setExpanded(false);
    clearTimeout(popupTimer.current);
    popupTimer.current = setTimeout(() => setShowPopup(false), 5000);
  }, []);

  useEffect(() => {
    if (!tracks.length) return;
    if (startedRef.current) return;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      playRandom(tracksRef.current);
    };
    window.addEventListener('click',      start, { once: true });
    window.addEventListener('keydown',    start, { once: true });
    window.addEventListener('touchstart', start, { once: true });
    return () => {
      window.removeEventListener('click',      start);
      window.removeEventListener('keydown',    start);
      window.removeEventListener('touchstart', start);
    };
  }, [tracks.length, playRandom]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const skip = () => playRandom(tracksRef.current);

  const toggleExpanded = () => {
    const opening = !expanded;
    setExpanded(opening);
    setShowPopup(true);
    clearTimeout(popupTimer.current);
    if (opening) {
      popupTimer.current = setTimeout(() => { setShowPopup(false); setExpanded(false); }, 8000);
    }
  };

  const visible = showPopup || expanded;

  return (
    <>
      <audio ref={audioRef} onEnded={() => playRandom(tracksRef.current)} />

      {tracks.length > 0 && (
        <div style={{ position: 'relative', display: 'inline-block' }}>

          {/* Popup — drops down from the nav button */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 9999,
              background: 'rgba(20,12,5,0.95)',
              border: '2px solid #ffd700',
              padding: '8px 12px',
              width: 210,
              transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.95)',
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? 'all' : 'none',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}
          >
            <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 6, color: '#ffd700', marginBottom: 4 }}>
              ♪ NOW PLAYING
            </div>
            {current && (
              <>
                <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>
                  {current.title}
                </div>
                {current.artist && (
                  <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>{current.artist}</div>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setMuted((m) => !m)}
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 7, padding: '3px 6px',
                  background: muted ? '#8b0000' : '#2d4a1e',
                  border: `1px solid ${muted ? '#ff4444' : '#5a9e4a'}`,
                  color: muted ? '#ff8888' : '#88dd66',
                  cursor: 'pointer',
                }}
              >
                {muted ? 'UNMUTE' : 'MUTE'}
              </button>
              <button
                onClick={skip}
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 7, padding: '3px 6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a4a8a',
                  color: '#aaaaff',
                  cursor: 'pointer',
                }}
              >
                SKIP ▶
              </button>
            </div>
          </div>

          {/* Compact music button that lives in the nav bar */}
          <button
            onClick={toggleExpanded}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: muted ? 'rgba(80,0,0,0.85)' : 'rgba(20,12,5,0.85)',
              border: `2px solid ${muted ? '#ff4444' : '#ffd700'}`,
              color: muted ? '#ff8888' : '#ffd700',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: muted ? 'none' : '0 0 8px rgba(255,215,0,0.4)',
            }}
            title={current?.title ?? 'Music'}
          >
            {muted ? '🔇' : '🎵'}
          </button>
        </div>
      )}
    </>
  );
}
