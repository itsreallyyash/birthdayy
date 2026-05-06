import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GameNav } from '@/components/game/GameNav';

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
      </div>
    </ProtectedRoute>
  );
}
