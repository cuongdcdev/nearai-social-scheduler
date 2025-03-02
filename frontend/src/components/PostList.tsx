import React, { useState } from 'react';

interface Post {
    id: number;
    content: string;
    scheduledAt: string;
}

interface PostListProps {
    posts: Post[];
    onEdit: (post: Post) => void;
    onDelete: (postId: number) => void;
    onReschedule: (post: Post) => void;
    onPostNow: (post: Post) => void;
}

const EditModal: React.FC<{
    post: Post;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedPost: Post) => void;
}> = ({ post, isOpen, onClose, onSave }) => {
    const [editedPost, setEditedPost] = useState<Post>(post);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Edit Post</h2>

                <textarea
                    value={editedPost.content}
                    onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
                    className="w-full p-2 border rounded mb-4"
                    placeholder="Content"
                    rows={4}
                />
                <input
                    type="datetime-local"
                    value={editedPost.scheduledAt.slice(0, 16)}
                    onChange={(e) => setEditedPost({ ...editedPost, scheduledAt: e.target.value })}
                    className="w-full p-2 border rounded mb-4"
                />
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave(editedPost);
                            onClose();
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const PostList: React.FC<PostListProps> = ({ posts, onEdit, onDelete, onReschedule, onPostNow }) => {
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const handleEdit = (post: Post) => {
        setEditingPost(post);
    };

    const handleSaveEdit = (updatedPost: Post) => {
        onEdit(updatedPost);
        setEditingPost(null);
    };
    if(!posts){
        return <div>no posts...</div>
    }
    return (
        <div className="post-list space-y-4">
            {posts && posts?.length === 0 ? (
                <p className="text-gray-500">No posts scheduled.</p>
            ) : (
                <ul className="space-y-4">
                    {posts.map(post => (
                        <li key={post.id} className="border rounded-lg p-4">
                            <p className="mt-2">{post.content}</p>
                            <p className="text-gray-600 mt-2">
                                Scheduled At: {new Date(post.scheduledAt).toLocaleString()}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {new Date(post.scheduledAt) > new Date() 
                                    ? `Post in ${Math.ceil((new Date(post.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60))} minutes`
                                    : 'Already scheduled'}
                            </p>
                            <div className="mt-4 space-x-2">
                                {/* <button
                                    onClick={() => handleEdit(post)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                >
                                    Edit
                                </button> */}

                                <button
                                    onClick={() => onDelete(post.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                                
                                {/* <button
                                    onClick={() => onReschedule(post)}
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                >
                                    Reschedule
                                </button> */}
    
                                {/* <button
                                    onClick={() => onPostNow(post)}
                                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                                >
                                    Post Now
                                </button> */}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {editingPost && (
                <EditModal
                    post={editingPost}
                    isOpen={true}
                    onClose={() => setEditingPost(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
};

export default PostList;