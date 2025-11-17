"use client";

import { useState, useEffect, useRef } from "react";

interface Comment {
  _id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    full_name: string;
    email: string;
  } | null;
}

interface TaskCommentsProps {
  taskId: string;
  isExpanded: boolean;
  currentUserId?: string;
}

export default function TaskComments({ taskId, isExpanded, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    if (!isExpanded) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [taskId, isExpanded]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment("");
        // Comment will be added via SSE
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment");
    }
    setSubmitting(false);
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditContent("");
        // Comment will be updated via SSE
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update comment");
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("Failed to update comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Comment will be removed via SSE
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment");
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  // Handle SSE updates
  const handleCommentEvent = (event: any) => {
    if (event.type === 'comment_created' && event.taskId === taskId) {
      setComments(prev => {
        // Avoid duplicates
        if (prev.some(c => c._id === event.comment._id)) return prev;
        return [...prev, event.comment];
      });
      setTimeout(scrollToBottom, 100);
    } else if (event.type === 'comment_updated') {
      setComments(prev => 
        prev.map(c => c._id === event.commentId ? event.comment : c)
      );
    } else if (event.type === 'comment_deleted' && event.taskId === taskId) {
      setComments(prev => prev.filter(c => c._id !== event.commentId));
    }
  };

  useEffect(() => {
    // Listen to SSE events from parent
    const handleSSE = (e: CustomEvent) => {
      handleCommentEvent(e.detail);
    };

    window.addEventListener('sse-event' as any, handleSSE);
    return () => window.removeEventListener('sse-event' as any, handleSSE);
  }, [taskId]);

  if (!isExpanded) return null;

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">Comments</h4>
      
      <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
        {loading && <p className="text-xs text-gray-500">Loading comments...</p>}
        
        {!loading && comments.length === 0 && (
          <p className="text-xs text-gray-500">No comments yet. Be the first to comment!</p>
        )}
        
        {comments.map((comment) => (
          <div key={comment._id} className="bg-gray-800 rounded p-3 text-sm">
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-gray-300">
                {comment.user?.full_name || "Unknown User"}
              </span>
              <div className="flex gap-2">
                {currentUserId && comment.userId === currentUserId && (
                  <>
                    {editingId === comment._id ? (
                      <>
                        <button
                          onClick={() => handleEdit(comment._id)}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(comment._id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {editingId === comment._id ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            ) : (
              <p className="text-gray-400 text-xs whitespace-pre-wrap">{comment.content}</p>
            )}
            
            <span className="text-xs text-gray-500 mt-1 block">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-gray-800 text-white text-sm rounded px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          {submitting ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
