'use client';

import { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { MusicUpload } from './MusicUpload';
import { TranscriptUpload } from './TranscriptUpload';
import { ContentManager } from './ContentManager';

type TabType = 'images' | 'music' | 'transcripts' | 'manage';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('images');

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Tab navigation */}
      <div className="bg-dark border-b-2 border-gray-600 overflow-x-auto">
        <div className="flex">
          {(['images', 'music', 'transcripts', 'manage'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 border-r border-gray-600 font-pixel text-xs transition-all ${
                activeTab === tab
                  ? 'bg-primary text-dark'
                  : 'bg-gray-900 text-secondary hover:bg-gray-800'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'images' && <ImageUpload />}
        {activeTab === 'music' && <MusicUpload />}
        {activeTab === 'transcripts' && <TranscriptUpload />}
        {activeTab === 'manage' && <ContentManager />}
      </div>
    </div>
  );
}
