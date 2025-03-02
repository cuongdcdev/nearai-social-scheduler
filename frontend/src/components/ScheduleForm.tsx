'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

// Define types for channels and form data
type Channel = {
  id: number;
  name: string;
  platformType: string;
  platformId: string;
  isActive: boolean;
};

type FormData = {
  content: string;
  scheduledTime: string;
  selectedChannels: number[];
};

interface ScheduleFormProps {
  onSubmit?: (data: FormData) => void;
  onSuccess?: () => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSubmit, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    content: '',
    scheduledTime: '',
    selectedChannels: [],
  });
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { user, token } = useAuth();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  // Set default time and fetch channels
  useEffect(() => {
    // Set default time to current time + 1 hour, rounded to nearest 5 minutes
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData(prev => ({ ...prev, scheduledTime: defaultTime }));
    
    // Fetch available distribution channels
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    if (!user?.id || !token) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/users/${user.id}/distribution-channels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChannels(data.filter((channel: Channel) => channel.isActive));
      } else {
        console.error("Failed to fetch channels");
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  const validateScheduledTime = (timeStr: string): boolean => {
    const scheduledTime = new Date(timeStr);
    const currentTime = new Date();
    
    if (scheduledTime <= currentTime) {
      setTimeError("Schedule time must be in the future");
      return false;
    }
    
    setTimeError(null);
    return true;
  };

  const handleChannelToggle = (channelId: number) => {
    setFormData(prev => {
      const currentSelected = [...prev.selectedChannels];
      
      if (currentSelected.includes(channelId)) {
        return { ...prev, selectedChannels: currentSelected.filter(id => id !== channelId) };
      } else {
        return { ...prev, selectedChannels: [...currentSelected, channelId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validate form
    if (!validateScheduledTime(formData.scheduledTime)) {
      return;
    }
    
    if (formData.selectedChannels.length === 0) {
      setSubmitError("Please select at least one distribution channel");
      return;
    }
    
    if (!formData.content.trim()) {
      setSubmitError("Content cannot be empty");
      return;
    }
    
    // Call onSubmit prop if provided (for external handling)
    if (onSubmit) {
      onSubmit(formData);
    }
    
    // Submit to API
    await createPost();
  };

  const createPost = async () => {
    if (!user?.id || !token) return;
    
    try {
      setIsLoading(true);
      
      // Convert local date-time to ISO format for API
      const scheduledAt = new Date(formData.scheduledTime).toISOString();
      
      const response = await fetch(`${backendUrl}/api/users/${user.id}/new-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: formData.content,
          scheduledAt: scheduledAt,
          distributionChannelIds: formData.selectedChannels
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Reset form on success
        setFormData({
          content: '',
          scheduledTime: formData.scheduledTime, // Keep the time for convenience
          selectedChannels: [],
        });
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setSubmitError(`Failed to create post: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="w-full">
        <label className="block text-sm font-medium mb-1">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full p-3 border rounded min-h-[150px]"
          rows={6}
          placeholder="Write your post content here..."
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Distribution Channels</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {channels.length > 0 ? (
            channels.map(channel => (
              <div key={channel.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`channel-${channel.id}`}
                  checked={formData.selectedChannels.includes(channel.id)}
                  onChange={() => handleChannelToggle(channel.id)}
                  className="mr-2 h-4 w-4"
                  disabled={isLoading}
                />
                <label htmlFor={`channel-${channel.id}`} className="text-sm">
                  {channel.name} <span className="text-xs text-gray-500">({channel.platformType.toLowerCase()})</span>
                </label>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No distribution channels available. Add channels in the Channels section.</p>
          )}
        </div>
        {submitError && formData.selectedChannels.length === 0 && (
          <p className="text-red-500 text-sm mt-1">Please select at least one channel</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Schedule Time</label>
        <input
          type="datetime-local"
          value={formData.scheduledTime}
          onChange={(e) => {
            const newTime = e.target.value;
            setFormData({ ...formData, scheduledTime: newTime });
            validateScheduledTime(newTime);
          }}
          className={`w-full p-2 border rounded ${timeError ? 'border-red-500' : ''}`}
          required
          disabled={isLoading}
        />
        {timeError && (
          <p className="text-red-500 text-sm mt-1">{timeError}</p>
        )}
      </div>
      
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {submitError}
        </div>
      )}
      
      <button
        type="submit"
        className={`w-full ${isLoading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 px-4 rounded font-medium flex justify-center items-center`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scheduling...
          </>
        ) : (
          'Schedule Post'
        )}
      </button>
    </form>
  );
};

export default ScheduleForm;