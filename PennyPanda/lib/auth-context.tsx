import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// Map PocketBase AuthModel to a simpler one
export type AuthModel = {
  id: string;
  email: string;
};

interface AuthContextType {
  session: AuthModel | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session, or create a mock one.
    const loadSession = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('@session');
        if (sessionStr) {
          setSession(JSON.parse(sessionStr));
        } else {
          // Force inject a default session since we have no auth guard anymore
          const defaultSession: AuthModel = { id: uuid.v4().toString(), email: 'penny@pennypanda.app' };
          await AsyncStorage.setItem('@session', JSON.stringify(defaultSession));
          setSession(defaultSession);
        }
      } catch (error) {
        console.error('Failed to load session', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const signUp = async (email: string, password: string) => {
    // In a completely offline app, we just create the user locally
    const usersJson = await AsyncStorage.getItem('@users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }
    
    const newUser = { id: uuid.v4().toString(), email, password }; // Note: In real world, hash password!
    users.push(newUser);
    await AsyncStorage.setItem('@users', JSON.stringify(users));
    
    await signIn(email, password);
  };

  const signIn = async (email: string, password: string) => {
    const usersJson = await AsyncStorage.getItem('@users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const userSession: AuthModel = { id: user.id, email: user.email };
    setSession(userSession);
    await AsyncStorage.setItem('@session', JSON.stringify(userSession));
  };

  const signOut = async () => {
    setSession(null);
    await AsyncStorage.removeItem('@session');
  };

  return (
    <AuthContext.Provider value={{ session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
