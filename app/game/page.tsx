import { GameWorld } from '@/components/game/GameWorld';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function GamePage() {
  return (
    <ProtectedRoute>
      <GameWorld />
    </ProtectedRoute>
  );
}
