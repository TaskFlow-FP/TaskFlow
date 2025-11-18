"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  project?: {
    _id: string;
    name: string;
  } | null;
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
  hasGoogleCalendar?: boolean;
  isGoogleUser?: boolean;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = params.id as string;
  const shouldAutoSync = searchParams.get('sync') === 'true';

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks?page=1&limit=1000`);
      const data = await res.json();
      if (res.ok) {
        const foundTask = data.tasks.find((t: Task) => t._id === taskId);
        if (foundTask) {
          if (foundTask.projectId) {
            try {
              const projectRes = await fetch(`/api/projects/${foundTask.projectId}`);
              
              if (projectRes.ok) {
                const projectData = await projectRes.json();
                
                foundTask.project = {
                  _id: projectData.project._id,
                  name: projectData.project.name
                };
              }
            } catch (err) {
            }
          }
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
        console.log("Current user data:", data);
        setCurrentUser(data);
      }
    } catch (error) {
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

  // Auto-sync to calendar if requested
  useEffect(() => {
    if (shouldAutoSync && task && currentUser?.isGoogleUser && task.due_date && !task.google_calendar_event_id && !syncing) {
      // Remove sync param from URL
      router.replace(`/task/${taskId}`, { scroll: false });
      // Trigger sync
      handleSyncCalendar();
    }
  }, [shouldAutoSync, task, currentUser]);

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

  const handleSyncCalendar = async () => {
    if (!task?.due_date) {
      Swal.fire('Error', 'Task must have a due date to sync with calendar', 'error');
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/calendar`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire('Success', 'Task synced to Google Calendar!', 'success');
        await fetchTask();
      } else if (res.status === 403) {
        // Calendar API not enabled
        Swal.fire({
          icon: 'error',
          title: 'Calendar API Not Enabled',
          html: `
            <p>Google Calendar API needs to be enabled in Google Cloud Console.</p>
            <p class="text-sm mt-3 text-gray-600">Steps for administrator:</p>
            <ol class="text-left text-sm mt-2 ml-6 space-y-1">
              <li>1. Visit <a href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=426382311425" target="_blank" class="text-blue-500 underline">Google Cloud Console</a></li>
              <li>2. Click "Enable API"</li>
              <li>3. Wait 2-3 minutes for activation</li>
            </ol>
          `,
          width: '600px',
        });
      } else if (res.status === 401 || data.needsReauth) {
        // Token expired, need re-auth
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Re-authentication Required',
          text: 'Your Google Calendar access has expired. Please login again with Google.',
          showCancelButton: true,
          confirmButtonText: 'Login with Google',
          cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
          window.location.href = '/api/auth/google';
        }
      } else if (res.status === 400 && data.error?.includes('logout and login')) {
        // User needs to re-authenticate with Google
        const result = await Swal.fire({
          icon: 'info',
          title: 'Google Calendar Permission Needed',
          text: 'To sync with Google Calendar, we need additional permissions. You will be redirected to sign in with Google.',
          showCancelButton: true,
          confirmButtonText: 'Continue with Google',
          cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
          window.location.href = '/api/auth/google';
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Calendar Sync Failed',
          html: data.error || 'Failed to sync with calendar',
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to sync with Google Calendar', 'error');
    }
    setSyncing(false);
  };

  const handleUnsyncCalendar = async () => {
    const result = await Swal.fire({
      title: 'Remove Calendar Sync?',
      text: 'This will remove the event from Google Calendar',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setSyncing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/calendar`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire('Success', 'Calendar sync removed', 'success');
        await fetchTask();
      } else {
        Swal.fire('Error', data.error || 'Failed to remove calendar sync', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to remove calendar sync', 'error');
    }
    setSyncing(false);
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
          {task.project && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Project
              </span>
              <h2 className="text-2xl font-bold text-blue-400 mt-1">
                {task.project.name}
              </h2>
            </div>
          )}
          <h1 className="text-4xl font-bold text-white">
            {task.title}
          </h1>
        </div>

        {/* Task Information Card */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">{task.title}</h2>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
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
                {task.project && (
                  <span className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-900/30 border border-purple-600 text-purple-400">
                    📁 Project: {task.project.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {task.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Description</h3>
              <p className="text-gray-400 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
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

          {/* Google Calendar Sync - Full Width for Better Visibility */}
          {task.due_date && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-5 border-2 border-blue-600/50 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🗓️</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Google Calendar Sync</h3>
                  <p className="text-xs text-gray-400">Keep your tasks organized in Google Calendar</p>
                </div>
              </div>
              
              {/* Already Synced */}
              {task.google_calendar_event_id ? (
                <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                  <p className="text-green-400 font-medium mb-3 flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <span>Synced with Google Calendar</span>
                  </p>
                  <button
                    onClick={handleUnsyncCalendar}
                    disabled={syncing}
                    className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 rounded hover:bg-red-600/30 disabled:opacity-50 text-sm"
                  >
                    {syncing ? 'Removing...' : '🗑️ Remove Sync'}
                  </button>
                </div>
              ) : currentUser?.isGoogleUser ? (
                /* Google User - Can Sync */
                <button
                  onClick={handleSyncCalendar}
                  disabled={syncing}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-base shadow-lg hover:shadow-xl transition-all"
                >
                  {syncing ? '⏳ Syncing...' : '➕ Add to Google Calendar'}
                </button>
              ) : (
                /* Non-Google User - Need to Sign In */
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-gray-400 text-sm mb-4">
                    ℹ️ Sign in with Google to enable calendar sync
                  </p>
                  <button
                    onClick={() => {
                      Swal.fire({
                        icon: 'info',
                        title: 'Google Account Required',
                        text: 'To sync with Google Calendar, you need to sign in with a Google account.',
                        showCancelButton: true,
                        confirmButtonText: 'Sign in with Google',
                        cancelButtonText: 'Cancel',
                      }).then((result) => {
                        if (result.isConfirmed) {
                          window.location.href = '/api/auth/google';
                        }
                      });
                    }}
                    className="w-full py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 font-medium text-base flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>
          )}
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
