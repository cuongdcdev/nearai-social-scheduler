// src/app/dashboard/page.tsx
'use client';
import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { DUMMY_POSTS, DUMMY_SOURCE_CHANNELS, DUMMY_DISTRIBUTION_CHANNELS } from '@/lib/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Dashboard</h1>
        {user && <p className="text-gray-600">Welcome: {user.accountId}!</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

{/*         
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Posts</h3>
          <p className="text-2xl md:text-3xl font-bold">{DUMMY_POSTS.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total scheduled posts</p>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Source Channels</h3>
          <p className="text-2xl md:text-3xl font-bold">{DUMMY_SOURCE_CHANNELS.length}</p>
          <p className="text-sm text-gray-500 mt-1">Connected sources</p>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Distribution Channels</h3>
          <p className="text-2xl md:text-3xl font-bold">{DUMMY_DISTRIBUTION_CHANNELS.length}</p>
          <p className="text-sm text-gray-500 mt-1">Connected channels</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            <li className="border-b pb-2">Post "First Scheduled Post" scheduled for {new Date('2024-01-20T10:00:00Z').toLocaleString()}</li>
            <li className="border-b pb-2">Connected new source: Industry Updates Medium</li>
            <li className="border-b pb-2">Updated settings for "Product Updates" channel</li>
            <li className="border-b pb-2">Post "Third Scheduled Post" scheduled for {new Date('2024-01-20T12:00:00Z').toLocaleString()}</li>
          </ul>
        </div>
      */}
      </div> 
    </div>
  );
}