'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BackgroundMusic } from '@/components/game/BackgroundMusic';

export function GameNav() {
  const router = useRouter();
  const { logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleAdmin = () => {
    router.push('/admin');
  };

  return (
    <nav className="bg-dark border-b-2 border-gray-400 p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img src="/sunflower.jpg" alt="" className="w-8 h-8 rounded-full object-cover border-2 border-primary" />
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-primary text-lg">VI X YASH</div>
      </div>
      <div className="flex gap-2 items-center">
        <BackgroundMusic />
        {isAdmin && (
          <button
            onClick={handleAdmin}
            className="pixel-btn-secondary text-xs"
          >
            ADMIN
          </button>
        )}
        <button
          onClick={handleLogout}
          className="pixel-btn text-xs"
        >
          EXIT
        </button>
      </div>
    </nav>
  );
}
