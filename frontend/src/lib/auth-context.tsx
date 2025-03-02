// src/lib/auth-context.tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import {setupMeteorWallet} from '@near-wallet-selector/meteor-wallet';

const crypto = require('crypto');

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
type User = {
  id: number;
  accountId: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null; 
  loginWithNEAR: () => any;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (localStorage.getItem('token')) {
      setToken (localStorage.getItem('token'));
    }

    setIsLoading(false);
  }, []);

  // const login = async () => {
  //   // Mock API call
  //   setIsLoading(true);
  //   try {
  //     // Simulate API delay
  //     await new Promise(resolve => setTimeout(resolve, 1000));

  //     // Mock successful login (in real app, validate with your API)
  //     if (email === 'demo@example.com' && password === 'password') {
  //       const userData = { id: 1, name: 'Demo User', email: 'demo@example.com' };
  //       setUser(userData);
  //       localStorage.setItem('user', JSON.stringify(userData));
  //       setIsLoading(false);
  //       return true;
  //     }
  //     setIsLoading(false);
  //     return false;
  //   } catch (error) {
  //     setIsLoading(false);
  //     return false;
  //   }
  // };

  const loginWithNEAR = async () => {
    setIsLoading(true);
    console.log('loginWithNEAR trigged! ');
    try {

      console.log("setup wallet selector...");
      const walletSelector = await setupWalletSelector({
        network: 'mainnet',
        modules: [setupMeteorWallet()],
        fallbackRpcUrls: ['https://free.rpc.fastnear.com' , 'https://near.lava.build']
      });
      console.log("walletSelector: ", walletSelector);  
      // 1. Generate a nonce
      const nonce = await crypto.randomBytes(32);

      // 2. Create message for signing
      const message = "Login with NEAR";
      const recipient = "near_social_scheduler";

      // 3. Request NEAR wallet to sign
      const wallet = await walletSelector.wallet("meteor-wallet");
      console.log("wallet: " , wallet);
      const signedMsg = await wallet.signMessage({
        message: message,
        recipient: recipient,
        nonce: nonce,
        callbackUrl: backendUrl + "/api/auth/login"
      });

      console.log("callbackurl: ", backendUrl);

      if (!signedMsg) {
        console.log("User cancelled login");
        alert("User cancelled login!");
        return false;
      }

      // 4. Send to backend
      const response = await fetch( backendUrl + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: signedMsg.accountId,
          publicKey: signedMsg.publicKey,
          signature: signedMsg.signature,
          message,
          recipient,
          nonce: nonce
        })
      });

      const data = await response.json();

      console.log("Login response: ", data);

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoading(false);



        // // Now you can use this token for authenticated requests
        // const userResponse = await fetch('/api/users/' + data.user.id, {
        //   headers: {
        //     'Authorization': `Bearer ${data.token}`
        //   }
        // });

        // const userData = await userResponse.json();

        
        return true;
      }

    } catch (error) {
      setIsLoading(false);
      return false;
    }
    return false;

  }

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user,  loginWithNEAR, token, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};