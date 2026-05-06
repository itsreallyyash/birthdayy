'use client';

import { useState, useRef } from 'react';
import { uploadMultipleFiles } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';

interface MusicFile {
  file: File;
  title: string;
  artist: string;
}

export function MusicUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMusicFiles = files.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: '',
    }));
    setMusicFiles([...musicFiles, ...newMusicFiles]);
  };

  const updateMusicFile = (
    idx: number,
    field: 'title' | 'artist',
    value: string
  ) => {
    const updated = [...musicFiles];
    updated[idx] = { ...updated[idx], [field]: value };
    setMusicFiles(updated);
  };

  const removeMusicFile = (idx: number) => {
    setMusicFiles(musicFiles.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (musicFiles.length === 0) {
      setMessage('No files selected');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setUploadProgress(0);

    try {
      const files = musicFiles.map((m) => m.file);
      const uploaded = await uploadMultipleFiles(files, 'music');

      console.log('[v0] Music files uploaded:', uploaded.length);

      const tracksToInsert = uploaded.map((item, idx) => {
        const musicFile = musicFiles.find((m) => m.file.name === item.file.name);
        return {
          blob_url: item.url,
          title: musicFile?.title || item.file.name,
          artist: musicFile?.artist || '',
          duration: 0,
          sort_order: idx,
        };
      });

      const { error } = await supabase
        .from('music_tracks')
        .insert(tracksToInsert);

      if (error) throw error;

      setMessage(`Successfully uploaded ${uploaded.length} tracks!`);
      setUploadProgress(100);
      setMusicFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[v0] Upload error:', error);
      setMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="pixel-card">
        <h2 className="font-pixel text-secondary mb-4">UPLOAD MUSIC</h2>

        <div className="border-2 border-dashed border-gray-600 rounded p-8 text-center cursor-pointer hover:border-secondary transition-all">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="music-input"
          />
          <label
            htmlFor="music-input"
            className="cursor-pointer block"
          >
            <div className="font-pixel text-accent mb-2">CLICK TO SELECT</div>
            <div className="text-xs text-gray-400">
              or drag and drop music files (MP3, WAV, OGG)
            </div>
          </label>
        </div>

        {musicFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="text-sm font-pixel text-secondary">
              FILES ({musicFiles.length}):
            </div>
            {musicFiles.map((m, idx) => (
              <div key={idx} className="bg-gray-800 border border-gray-600 p-3 rounded space-y-2">
                <Input
                  value={m.title}
                  onChange={(e) => updateMusicFile(idx, 'title', e.target.value)}
                  placeholder="Track Title"
                  className="text-xs"
                />
                <Input
                  value={m.artist}
                  onChange={(e) => updateMusicFile(idx, 'artist', e.target.value)}
                  placeholder="Artist Name (optional)"
                  className="text-xs"
                />
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{m.file.name}</span>
                  <button
                    onClick={() => removeMusicFile(idx)}
                    className="pixel-btn text-xs px-2"
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="pixel-btn w-full"
            >
              {isUploading ? `UPLOADING ${uploadProgress}%...` : 'UPLOAD ALL'}
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 p-3 border-2 text-xs ${
              message.includes('Successfully')
                ? 'bg-green-900 border-green-600 text-green-100'
                : 'bg-red-900 border-red-600 text-red-100'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
