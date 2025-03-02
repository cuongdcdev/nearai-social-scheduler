// src/app/sources/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

type PrefSourceItem = {
  id: number, //pref id, not the source id
  source: {
    id: number, //the real source id
    name: string,
    platformType: string,
    platformId: string,
  },
  translationPrompt: string,
  autoTranslate: boolean,
}

export default function SourcesPage() {
  const [sources, setSources] = useState([] as PrefSourceItem[]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDisableOpen, setIsConfirmDisableOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  
  const [newSource, setNewSource] = useState({
    id: 0,
    source: {
      platformId: '',
      name: '',
      platformType: 'telegram',
    },
    translationPrompt: '',
    autoTranslate: true,
  });
  
  const [editSource, setEditSource] = useState({
    id: 0,
    translationPrompt: '',
  });

  const { user, token } = useAuth();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:6969';

  useEffect(() => {
    fetchSources();
  }, [user, token]);

  const fetchSources = async () => {
    if (!user?.id || !token) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/users/${user?.id}/source-preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setSources(data);
      console.log("list of sources: ", data);
    } catch (error) {
      console.error("Error fetching sources:", error);
    }
  };

  const handleAddSource = async () => {
    try {
      const requestBody = {
        name: newSource.source.name,
        platformType: newSource.source.platformType,
        platformId: newSource.source.platformId,
        translationPrompt: newSource.translationPrompt,
        autoTranslate: newSource.autoTranslate
      };

      const response = await fetch(`${backendUrl}/api/users/${user?.id}/add-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        fetchSources(); // Refresh the list
        setIsAddModalOpen(false);
        setNewSource({
          id: 0,
          source: {
            platformId: '',
            name: '',
            platformType: 'telegram',
          },
          translationPrompt: '',
          autoTranslate: true,
        });
      } else {
        console.error("Failed to add source");
      }
    } catch (error) {
      console.error("Error adding source:", error);
    }
  };

  const handleEditClick = (source: PrefSourceItem) => {
    setEditSource({
      id: source.id,
      translationPrompt: source.translationPrompt,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const requestBody = {
        sourceId: editSource.id,
        translationPrompt: editSource.translationPrompt,
        // Include these if you want to allow users to update them in the future
        // customFetchIntervalSeconds: 7200, 
        // autoTranslate: true,
      };

      // Updated to use the same API endpoint pattern as handleAddSource
      const response = await fetch(`${backendUrl}/api/users/${user?.id}/add-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        fetchSources(); // Refresh the list
        setIsEditModalOpen(false);
      } else {
        console.error("Failed to update source");
      }
    } catch (error) {
      console.error("Error updating source:", error);
    }
  };

  const handleDisableClick = (sourceId: number) => {
    setSelectedSourceId(sourceId);
    setIsConfirmDisableOpen(true);
  };

  const handleDisableConfirm = async () => {
    if (!selectedSourceId) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/sources/${selectedSourceId}/unsubscribe/${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        fetchSources(); // Refresh the list
        setIsConfirmDisableOpen(false);
        setSelectedSourceId(null);
      } else {
        console.error("Failed to disable source");
      }
    } catch (error) {
      console.error("Error disabling source:", error);
      setIsConfirmDisableOpen(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-0">My Source Channels</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Source
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Type</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Id</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NEAR AI Prompt</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map(ob => (
                <tr key={ob.id}>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">{ob.source.name}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap capitalize">{ob.source.platformType}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">{ob.source.platformId}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-normal max-w-xs truncate">{ob.translationPrompt || '-'}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button 
                      onClick={() => handleEditClick(ob)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDisableClick(ob.source.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Disable
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="space-y-4">
          {sources.map(source => (
            <div key={source.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{source.source.name}</h3>
                <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{source.source.platformType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform ID:</span>
                  <span className="font-medium">{source.source.platformId}</span>
                </div>
                <div className="flex justify-between">
                  <span>NEAR AI Prompt:</span>
                  <span className="font-medium">{source.translationPrompt || '-'}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2 border-t">
                <button 
                  onClick={() => handleEditClick(source)}
                  className="text-blue-500 hover:text-blue-700">
                  Edit
                </button>
                <button 
                  onClick={() => handleDisableClick(source.id)}
                  className="text-red-500 hover:text-red-700">
                  Disable
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Source</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newSource.source.name}
                  onChange={(e) => setNewSource({
                    ...newSource,
                    source: {
                      ...newSource.source,
                      name: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newSource.source.platformType}
                  onChange={(e) => setNewSource({
                    ...newSource,
                    source: {
                      ...newSource.source,
                      platformType: e.target.value
                    }
                  })}
                >
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform ID</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newSource.source.platformId}
                  onChange={(e) => setNewSource({
                    ...newSource,
                    source: {
                      ...newSource.source,
                      platformId: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NEAR AI Prompt</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={newSource.translationPrompt}
                  onChange={(e) => setNewSource({
                    ...newSource,
                    translationPrompt: e.target.value
                  })}
                  placeholder="Enter a custom prompt for NEAR AI translation"
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
                  onClick={handleAddSource}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Source
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit NEAR AI Prompt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">NEAR AI Prompt</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={4}
                  value={editSource.translationPrompt}
                  onChange={(e) => setEditSource({
                    ...editSource,
                    translationPrompt: e.target.value
                  })}
                  placeholder="Enter a custom prompt for NEAR AI translation"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Disable Modal */}
      {isConfirmDisableOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Confirm Disable</h2>
            <p className="text-gray-700 mb-4">Are you sure you want to disable this source? You will no longer receive content from this channel.</p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsConfirmDisableOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableConfirm}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Disable Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}