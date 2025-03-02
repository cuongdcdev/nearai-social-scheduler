'use client';
import React, { useState, useEffect } from 'react';
import ScheduleForm from '@/components/ScheduleForm';
import PostList from '@/components/PostList';
import { useAuth } from '@/lib/auth-context';

export default function SchedulePage() {
  const [posts, setPosts] = useState<any[]>([]);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  const { user, token } = useAuth();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchPosts();
  }, [user, token]);

  const fetchPosts = async () => {
    if (!user?.id || !token) return;

    try {
      const response = await fetch(`${backendUrl}/api/users/${user?.id}/posts?unpostedOnly=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const onDelete = (id: number) => {
    setPostToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user?.id || !token || !postToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const response = await fetch(`${backendUrl}/api/users/${user.id}/posts/${postToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      const result = await response.json();

      // Update local state to remove the deleted post
      setPosts(posts.filter(post => post.id !== postToDelete));

      // Reset delete confirmation state
      setShowDeleteConfirm(false);
      setPostToDelete(null);

    } catch (error) {
      console.error('Error deleting post:', error);
      setDeleteError('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPostToDelete(null);
    setDeleteError(null);
  };

  const handleScheduleSubmit = (data: { content: string; scheduledTime: string }) => {
    // This will be handled by the ScheduleForm component's API call
    fetchPosts(); // Refresh the posts list after a new post is created
  };

  const handleScheduleSuccess = () => {
    fetchPosts(); // Refresh posts after successful scheduling
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Schedule New Post</h1>
        <div className="max-w-2xl">
          <ScheduleForm onSubmit={handleScheduleSubmit} onSuccess={handleScheduleSuccess} />
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Pending Posts</h2>
        <PostList posts={posts}
          onDelete={onDelete}
          onEdit={() => { }}
          onPostNow={() => { }}
          onReschedule={() => { }} />
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Delete Post</h3>
            <p className="mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              >
                {isDeleting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}