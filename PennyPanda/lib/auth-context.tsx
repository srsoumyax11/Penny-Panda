import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

export type AuthModel = {
  id: string;
  email: string;
  name: string;
};

interface AuthContextType {
  session: AuthModel | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('@session');
        const isLoggedIn = await AsyncStorage.getItem('@isLoggedIn');
        
        if (isLoggedIn === 'true') {
          if (sessionStr) {
            try {
              setSession(JSON.parse(sessionStr));
            } catch (e) {
              console.error('Failed to parse session, wiping data...');
              await signOut(); // Clear everything if corrupted
            }
          } else {
            console.error('Logged in flag set but no session found, wiping data...');
            await signOut(); // Clear everything if inconsistent
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const usersJson = await AsyncStorage.getItem('@users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      const emailLower = email.toLowerCase().trim();
      
      if (users.find((u: any) => u.email === emailLower)) {
        throw new Error('User already exists');
      }
      
      const newUser = { 
        id: uuid.v4().toString(), 
        email: emailLower, 
        password, 
        name: name.trim() 
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('@users', JSON.stringify(users));
      
      // Auto sign in after signup
      await signIn(emailLower, password);
    } catch (error) {
      console.error('SignUp Error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const usersJson = await AsyncStorage.getItem('@users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      const emailLower = email.toLowerCase().trim();
      const user = users.find((u: any) => u.email === emailLower && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password. Please try again.');
      }
      
      const userSession: AuthModel = { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      };
      
      await AsyncStorage.setItem('@session', JSON.stringify(userSession));
      await AsyncStorage.setItem('@isLoggedIn', 'true');
      setSession(userSession);
    } catch (error) {
      console.error('SignIn Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setSession(null);
      await AsyncStorage.multiRemove([
        '@session',
        '@isLoggedIn',
        '@expenses',
        '@budgets',
        '@user_settings'
      ]);
    } catch (error) {
      console.error('SignOut Error:', error);
    }
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
