import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GameNav } from '@/components/game/GameNav';
import { BackgroundMusic } from '@/components/game/BackgroundMusic';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="pixel-container">
        <GameNav />
        {children}
        <BackgroundMusic />
      </div>
    </ProtectedRoute>
  );
}
