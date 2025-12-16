import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  setApiKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    // Try to get API key from cookie first (what the client expects)
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (cookieToken) {
      setApiKeyState(cookieToken);
      return;
    }

    // Fallback to localStorage
    const storedKey = localStorage.getItem('taylordb_api_key');
    if (storedKey) {
      setApiKeyState(storedKey);
    }
  }, []);

  const setApiKey = (key: string) => {
    // Set both localStorage and cookie for compatibility
    localStorage.setItem('taylordb_api_key', key);
    document.cookie = `authToken=${key}; path=/; max-age=86400`; // 24 hours
    setApiKeyState(key);
    // Reload to reinitialize the TaylorDB client
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>TaylorDB Authentication</CardTitle>
            <CardDescription>
              Please enter your TaylorDB API key to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full">
                Connect to TaylorDB
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: true, apiKey, setApiKey }}>
      {children}
    </AuthContext.Provider>
  );
}