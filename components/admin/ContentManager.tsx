'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Message, ImageMetadata, MusicTrack } from '@/lib/types';

export function ContentManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'images' | 'tracks'>('messages');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [messagesRes, imagesRes, tracksRes] = await Promise.all([
          supabase.from('messages').select('*').order('created_at', { ascending: false }),
          supabase.from('images').select('*').order('sort_order', { ascending: true }),
          supabase.from('music_tracks').select('*').order('sort_order', { ascending: true }),
        ]);

        if (messagesRes.data) setMessages(messagesRes.data);
        if (imagesRes.data) setImages(imagesRes.data);
        if (tracksRes.data) setTracks(tracksRes.data);
      } catch (error) {
        console.error('[v0] Error fetching content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const deleteMessage = async (id: string) => {
    try {
      await supabase.from('messages').delete().eq('id', id);
      setMessages(messages.filter((m) => m.id !== id));
    } catch (error) {
      console.error('[v0] Delete error:', error);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await supabase.from('images').delete().eq('id', id);
      setImages(images.filter((img) => img.id !== id));
    } catch (error) {
      console.error('[v0] Delete error:', error);
    }
  };

  const deleteTrack = async (id: string) => {
    try {
      await supabase.from('music_tracks').delete().eq('id', id);
      setTracks(tracks.filter((t) => t.id !== id));
    } catch (error) {
      console.error('[v0] Delete error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-secondary font-pixel">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['messages', 'images', 'tracks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pixel-btn text-xs ${
              activeTab === tab ? 'bg-primary text-dark' : 'bg-gray-700'
            }`}
          >
            {tab === 'messages' ? `MESSAGES (${messages.length})` : ''}
            {tab === 'images' ? `IMAGES (${images.length})` : ''}
            {tab === 'tracks' ? `TRACKS (${tracks.length})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'messages' && (
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-xs">No messages uploaded yet</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-gray-800 border-2 border-gray-600 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div
                    className="font-pixel text-sm"
                    style={{ color: msg.avatar_color }}
                  >
                    {msg.speaker}
                  </div>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="pixel-btn text-xs px-2 bg-red-600 hover:bg-red-700"
                  >
                    DEL
                  </button>
                </div>
                <p className="text-xs text-gray-200">{msg.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {images.length === 0 ? (
            <div className="text-gray-400 text-xs col-span-full">No images uploaded yet</div>
          ) : (
            images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.blob_url}
                  alt={img.filename}
                  className="w-full aspect-square object-cover border-2 border-gray-600"
                />
                <button
                  onClick={() => deleteImage(img.id)}
                  className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <span className="pixel-btn text-xs px-2 bg-red-600">DELETE</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'tracks' && (
        <div className="space-y-2">
          {tracks.length === 0 ? (
            <div className="text-gray-400 text-xs">No tracks uploaded yet</div>
          ) : (
            tracks.map((track) => (
              <div key={track.id} className="bg-gray-800 border-2 border-gray-600 p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-pixel text-sm text-primary">{track.title}</div>
                    <div className="text-xs text-gray-400">{track.artist}</div>
                  </div>
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="pixel-btn text-xs px-2 bg-red-600 hover:bg-red-700"
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
