// src/app/channels/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { useAuth } from '@/lib/auth-context';

type Channel = {
  id: number;
  name: string;
  platformType: string;
  platformId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    platformType: 'telegram',
    platformId: '',
  });

  const { user, token } = useAuth();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchChannels();
  }, [user?.id, token]);

  const fetchChannels = async () => {
    if (!user?.id || !token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${backendUrl}/api/users/${user?.id}/distribution-channels`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }

      const data = await response.json();
      setChannels(data);
      console.log("Fetched channels:", data);
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChannel = async () => {
    if (!user?.id || !token) return;

    // Validate required fields
    if (!newChannel.name || !newChannel.platformType || !newChannel.platformId) {
      alert("Please fill in all required fields: name, platform type, and platform ID.");
      return;
    }

    // Validate Telegram platform ID format
    if (newChannel.platformType === 'telegram') {
      // Telegram group IDs should be numeric and often start with -100
      const telegramIdPattern = /^-?\d+$/;
      if (!telegramIdPattern.test(newChannel.platformId)) {
        alert("Invalid Telegram group ID. Please enter a valid numeric ID (e.g., -1001960274091)");
        return;
      }
    }

    try {
      setIsLoading(true); // Show loading state

      const response = await fetch(`${backendUrl}/api/users/${user.id}/distribution-channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newChannel.name,
          platformType: newChannel.platformType.toLowerCase(),
          platformId: newChannel.platformId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success case - add the new channel to the state to avoid a full refetch
        const newChannelData = data.channel;
        setChannels([...channels, newChannelData]);
        setIsAddModalOpen(false);
        setNewChannel({ name: '', platformType: 'telegram', platformId: '' });
      } else {
        // Handle different error cases
        if (response.status === 400) {
          alert("Missing required fields. Please make sure all fields are filled in.");
        } else if (response.status === 409) {
          alert(`Duplicate channel: ${data.message}`);
        } else {
          alert(`Failed to add channel: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error adding channel:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirm = (channel: Channel) => {
    setSelectedChannelId(channel.id);
    setSelectedChannelName(channel.name);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteChannel = async () => {
    if (!user?.id || !token || !selectedChannelId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`${backendUrl}/api/users/${user.id}/distribution-channels/${selectedChannelId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete channel');
      }

      const result = await response.json();
      console.log("Delete result:", result);

      // Remove the deleted channel from the state
      setChannels(channels.filter(channel => channel.id !== selectedChannelId));

      // Close the confirmation dialog
      setIsDeleteConfirmOpen(false);
      setSelectedChannelId(null);
      setSelectedChannelName('');
    } catch (error) {
      console.error("Error deleting channel:", error);
      alert("Failed to delete channel. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Channel },
    {
      header: 'Type',
      accessor: (channel: Channel) => <span className="capitalize">{channel.platformType.toLowerCase()}</span>
    },
    {
      header: 'Platform ID',
      accessor: 'platformId' as keyof Channel
    },
    {
      header: 'Status',
      accessor: (channel: Channel) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${channel.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {channel.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const renderActions = (channel: Channel) => (
    <div className="space-x-2">
      <button
        className="text-red-500 hover:text-red-700"
        onClick={() => openDeleteConfirm(channel)}
      >
        Delete
      </button>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-0">Distribution Channels</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Channel
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={channels}
          keyField="id"
          actions={renderActions}
          emptyMessage="No distribution channels found. Add your first channel to get started."
        />
      )}

      {/* Add Channel Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Distribution Channel</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="My Telegram Channel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newChannel.platformType}
                  onChange={(e) => setNewChannel({ ...newChannel, platformType: e.target.value })}
                >
                  <option value="telegram">Telegram</option>
                  {/* <option value="twitter">Twitter</option>
                  <option value="discord">Discord</option> */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform ID</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newChannel.platformId}
                  onChange={(e) => setNewChannel({ ...newChannel, platformId: e.target.value })}
                  placeholder={newChannel.platformType === 'telegram' ? '-1001234567890 (Telegram group ID)' :
                    newChannel.platformType === 'twitter' ? 'twitter_handle' : 'server_id'}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChannel}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Channel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Channel</h2>
            <p className="mb-4">
              Are you sure you want to delete the channel "{selectedChannelName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 flex items-center"
              >
                {isDeleting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}