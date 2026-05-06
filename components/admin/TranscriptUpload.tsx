'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';

interface ParsedMessage {
  speaker: string;
  content: string;
  timestamp?: string;
}

const AVATAR_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da'];

function parseTranscript(text: string): ParsedMessage[] {
  const lines = text.split('\n');
  const messages: ParsedMessage[] = [];
  let currentMessage: Partial<ParsedMessage> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to match "Speaker: message" format
    const speakerMatch = trimmed.match(/^([^:]+):\s*(.+)$/);

    if (speakerMatch) {
      if (currentMessage && currentMessage.speaker) {
        messages.push(currentMessage as ParsedMessage);
      }
      currentMessage = {
        speaker: speakerMatch[1].trim(),
        content: speakerMatch[2].trim(),
      };
    } else if (currentMessage) {
      // Append to content if continuation
      currentMessage.content += ' ' + trimmed;
    }
  }

  if (currentMessage && currentMessage.speaker) {
    messages.push(currentMessage as ParsedMessage);
  }

  return messages;
}

export function TranscriptUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Message[]>([]);
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setTextContent(text);

      // Parse the transcript
      const parsed = parseTranscript(text);
      const previewMessages: Message[] = parsed.map((msg, idx) => ({
        id: `preview-${idx}`,
        speaker: msg.speaker,
        content: msg.content,
        timestamp: msg.timestamp,
        avatar_color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      }));

      setPreview(previewMessages);
      setMessage('');
    } catch (error) {
      setMessage(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpload = async () => {
    if (preview.length === 0) {
      setMessage('No messages to upload');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const messagesToInsert = preview.map((msg) => ({
        speaker: msg.speaker,
        content: msg.content,
        timestamp: msg.timestamp,
        avatar_color: msg.avatar_color,
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (error) throw error;

      setMessage(`Successfully uploaded ${preview.length} messages!`);
      setPreview([]);
      setTextContent('');

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
    <div className="max-w-4xl space-y-4">
      <div className="pixel-card">
        <h2 className="font-pixel text-secondary mb-4">UPLOAD TRANSCRIPT</h2>

        <div className="border-2 border-dashed border-gray-600 rounded p-8 text-center cursor-pointer hover:border-secondary transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="transcript-input"
          />
          <label
            htmlFor="transcript-input"
            className="cursor-pointer block"
          >
            <div className="font-pixel text-accent mb-2">CLICK TO SELECT</div>
            <div className="text-xs text-gray-400">
              or drag and drop transcript file (.txt)
            </div>
          </label>
        </div>

        {preview.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm font-pixel text-secondary">
                PREVIEW ({preview.length} messages):
              </div>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="pixel-btn text-xs"
              >
                {isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
              </button>
            </div>

            <div className="bg-gray-800 border-2 border-gray-600 p-3 rounded max-h-96 overflow-y-auto space-y-2">
              {preview.slice(0, 10).map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-gray-700 border border-gray-600 p-2 rounded text-xs"
                >
                  <div
                    className="font-pixel"
                    style={{ color: msg.avatar_color }}
                  >
                    {msg.speaker}
                  </div>
                  <div className="text-gray-200 mt-1">{msg.content}</div>
                </div>
              ))}
              {preview.length > 10 && (
                <div className="text-center text-gray-400 text-xs py-2">
                  ... and {preview.length - 10} more messages
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">
              <strong>Format expected:</strong> One message per line as "Speaker: message text"
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
    </div>
  );
}
