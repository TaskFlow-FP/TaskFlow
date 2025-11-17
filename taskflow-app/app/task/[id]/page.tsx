"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import SidebarLayout from "@/app/components/SidebarLayout";
import Swal from "sweetalert2";

interface Task {
  _id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  google_calendar_event_id: string | null;
  createdAt: string;
  updatedAt: string;
}

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

interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks?page=1&limit=1000`);
      const data = await res.json();
      if (res.ok) {
        const foundTask = data.tasks.find((t: Task) => t._id === taskId);
        if (foundTask) {
          setTask(foundTask);
        } else {
          Swal.fire({
            icon: "error",
            title: "Task Not Found",
            text: "This task does not exist or you don't have access to it",
          }).then(() => router.push("/"));
        }
      } else if (res.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "Please login to view this task",
        }).then(() => router.push("/login"));
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load task",
      }).then(() => router.push("/"));
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/users/me");
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  };

  const initializePage = async () => {
    setLoading(true);
    await Promise.all([fetchTask(), fetchComments(), fetchCurrentUser()]);
    setLoading(false);
  };

  useEffect(() => {
    initializePage();
  }, [taskId]);

  // SSE for realtime updates
  useEffect(() => {
    const eventSource = new EventSource("/api/tasks/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "comment_created" && data.taskId === taskId) {
          setComments((prev) => {
            if (prev.some((c) => c._id === data.comment._id)) return prev;
            return [...prev, data.comment];
          });
          setTimeout(scrollToBottom, 100);
        } else if (data.type === "comment_updated") {
          setComments((prev) =>
            prev.map((c) => (c._id === data.commentId ? data.comment : c))
          );
        } else if (data.type === "comment_deleted" && data.taskId === taskId) {
          setComments((prev) => prev.filter((c) => c._id !== data.commentId));
        } else if (data.type === "task_updated" && data.taskId === taskId) {
          fetchTask();
        } else if (data.type === "task_deleted" && data.taskId === taskId) {
          Swal.fire({
            icon: "info",
            title: "Task Deleted",
            text: "This task has been deleted",
          }).then(() => router.push("/"));
        }
      } catch (error) {}
    };

    return () => {
      eventSource.close();
    };
  }, [taskId]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
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
      } else {
        const data = await res.json();
        Swal.fire({
          icon: "error",
          title: "Failed to Post Comment",
          text: data.error || "Something went wrong",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to post comment",
      });
    }
    setSubmitting(false);
  };

  const handleEditComment = async (commentId: string) => {
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
      } else {
        const data = await res.json();
        Swal.fire({
          icon: "error",
          title: "Failed to Update",
          text: data.error || "Something went wrong",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update comment",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await Swal.fire({
      title: "Delete Comment",
      text: "Are you sure you want to delete this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          Swal.fire({
            icon: "error",
            title: "Failed to Delete",
            text: data.error || "Something went wrong",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete comment",
        });
      }
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-600 text-white";
      case "in_progress":
        return "bg-blue-600 text-white";
      case "todo":
        return "bg-yellow-600 text-white";
      case "backlog":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading task details...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!task) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-400">
            <p className="text-xl">Task not found</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <span className="text-xl">←</span>
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold text-white">Task Details</h1>
        </div>

        {/* Task Information Card */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">{task.title}</h2>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.replace("_", " ")}
                </span>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          </div>

          {task.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Description</h3>
              <p className="text-gray-400 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {task.due_date && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 mb-1">Due Date</p>
                <p className="text-white font-medium">
                  📅{" "}
                  {new Date(task.due_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 mb-1">Created</p>
              <p className="text-white font-medium">
                {new Date(task.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {task.google_calendar_event_id && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 mb-1">Calendar Sync</p>
                <p className="text-blue-400 font-medium">🗓️ Synced with Google Calendar</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Comments ({comments.length})
            </h3>
            <p className="text-gray-400">Discuss this task with your team</p>
          </div>

          {/* Comments List */}
          <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <div className="text-center py-12 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
                <p className="text-gray-400 text-lg mb-2">💬 No comments yet</p>
                <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => {
                // Convert both IDs to string for reliable comparison
                const currentUserIdStr = currentUser?.id?.toString();
                const commentUserIdStr = comment.userId?.toString();
                const isOwner = currentUserIdStr && commentUserIdStr && currentUserIdStr === commentUserIdStr;
                const userName = isOwner ? "You" : (comment.user?.full_name || "Unknown User");
                const initials = comment.user?.full_name
                  ? getInitials(comment.user.full_name)
                  : "?";
                const avatarColor = getAvatarColor(comment.userId);

                return (
                  <div
                    key={comment._id}
                    className={`flex gap-4 p-4 rounded-lg ${
                      isOwner ? "bg-blue-900/20 border border-blue-700/50" : "bg-gray-700/50"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}
                    >
                      {initials}
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-white">
                            {userName}
                            {isOwner && (
                              <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">
                                Your comment
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {comment.updatedAt !== comment.createdAt && " (edited)"}
                          </p>
                        </div>

                        {isOwner && (
                          <div className="flex gap-2">
                            {editingId === comment._id ? (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment._id)}
                                  className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded transition"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(comment)}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-xs text-red-400 hover:text-red-300 transition"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {editingId === comment._id ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                          rows={3}
                        />
                      ) : (
                        <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSubmitComment} className="border-t border-gray-700 pt-6">
            <div className="flex gap-4">
              {currentUser && (
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full ${getAvatarColor(
                    currentUser.id
                  )} flex items-center justify-center text-white font-bold`}
                >
                  {getInitials(currentUser.name)}
                </div>
              )}

              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-gray-700 text-white rounded-lg p-4 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  disabled={submitting}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-gray-400">
                    {currentUser ? `Posting as ${currentUser.name}` : "Please login to comment"}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    {submitting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
