'use client';

import { useState, useRef } from 'react';
import { uploadMultipleFiles } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setMessage('');
    setUploadProgress(0);

    try {
      console.log('[v0] Starting image upload for', files.length, 'files');

      // Upload files to Vercel Blob
      const uploaded = await uploadMultipleFiles(files, 'image');

      console.log('[v0] Files uploaded to Blob:', uploaded.length);

      // Save metadata to Supabase
      const imagesToInsert = uploaded.map((item, idx) => ({
        blob_url: item.url,
        filename: item.file.name,
        category: 'General',
        sort_order: idx,
      }));

      const { error } = await supabase
        .from('images')
        .insert(imagesToInsert);

      if (error) throw error;

      setMessage(`Successfully uploaded ${uploaded.length} images!`);
      setUploadProgress(100);

      // Reset file input
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
        <h2 className="font-pixel text-secondary mb-4">UPLOAD IMAGES</h2>

        <div className="border-2 border-dashed border-gray-600 rounded p-8 text-center cursor-pointer hover:border-secondary transition-all">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="image-input"
          />
          <label
            htmlFor="image-input"
            className="cursor-pointer block"
          >
            <div className="font-pixel text-accent mb-2">CLICK TO SELECT</div>
            <div className="text-xs text-gray-400">
              or drag and drop images (PNG, JPG, GIF)
            </div>
          </label>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 border-2 border-gray-600 h-4">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center">
              Uploading... {uploadProgress}%
            </div>
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

      <div className="pixel-card text-xs text-gray-400">
        <div className="font-pixel text-secondary mb-2">TIPS:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Maximum 100 images per upload</li>
          <li>Recommended size: 800x600 pixels or larger</li>
          <li>Supported formats: PNG, JPG, GIF, WebP</li>
          <li>Large images will be optimized automatically</li>
        </ul>
      </div>
    </div>
  );
}
