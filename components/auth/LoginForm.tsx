'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated (returning with active session)
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/game');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const passwordToCheck = isAdmin ? adminPassword : password;

    if (!passwordToCheck.trim()) {
      setError('Please enter a password.');
      return;
    }

    setIsLoading(true);

    const success = isAdmin
      ? login('', adminPassword)
      : login(passwordToCheck);

    if (success) {
      router.push('/game');
    } else {
      setError('Invalid password.');
      setIsLoading(false);
    }
  };

  const handleAdminToggle = () => {
    setIsAdmin(!isAdmin);
    setError('');
    setPassword('');
    setAdminPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative sunflowers */}
      <div className="absolute top-10 left-10 text-6xl opacity-20">🌻</div>
      <div className="absolute bottom-20 right-10 text-7xl opacity-20">🌻</div>
      <div className="absolute top-1/4 right-20 text-5xl opacity-15">🌼</div>

      {/* Decorative blue lilies */}
      <div className="absolute bottom-10 left-20 text-6xl opacity-20">💙</div>
      <div className="absolute top-1/3 left-1/4 text-5xl opacity-15">🌸</div>

      <div className="pixel-card w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <img
            src="/sunflower.jpg"
            alt="sunflower"
            className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-primary shadow-lg"
          />
          <h1 style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-3xl text-primary text-center">
      VI X YASH'S WORLD
</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin ? (
            <div>
              <label style={{ fontFamily: "'Press Start 2P', cursive" }} className="block text-xs mb-2 text-foreground">
                ENTER PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border-2 border-primary bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-muted mt-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                yellowblue
              </p>
            </div>
          ) : (
            <div>
              <label style={{ fontFamily: "'Press Start 2P', cursive" }} className="block text-xs mb-2 text-foreground">
                ADMIN PASSWORD
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border-2 border-primary bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
                autoFocus
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div
              className="bg-red-100 border-2 border-red-400 p-2 text-red-700 text-xs"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="pixel-btn w-full text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {isLoading ? 'LOADING...' : isAdmin ? 'ADMIN LOGIN' : 'ENTER WORLD'}
          </button>

          <button
            type="button"
            onClick={handleAdminToggle}
            disabled={isLoading}
            className="w-full py-2 border-t-2 border-gray-400 mt-4 text-xs text-foreground hover:bg-yellow-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {isAdmin ? '← BACK' : 'ADMIN →'}
          </button>
        </form>
      </div>
    </div>
  );
}
