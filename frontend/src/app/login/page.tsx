// src/app/login/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState('');
  const { loginWithNEAR, user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('loginWithNEAR btn');
    e.preventDefault();
    setError('');


    const success = await loginWithNEAR();
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };




  const login = async () => {
    console.log('loginWithNEAR trigged 1 ');
    setError('');

    const success = await loginWithNEAR();
    if (success) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">NEAR AI Social Media Scheduler</h1>

        <div className='flex flex-col items-center max-w-2xl mx-auto text-center mb-8'>
          <p className='text-gray-700 leading-relaxed mb-4'>
            Gathers social media content (like Telegram) using NEAR AI to customize,
            translate, edit, and schedule posts.
          </p>
          <p className='text-gray-600'>
            Great for groups to catch up on crypto news and research in a personalized,
            accessible way
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300" onClick={async () => { await login() }}>Login with NEAR</button>

        <hr />

      </div>
    </div>
  );
}