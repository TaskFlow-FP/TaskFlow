"use client";

import { useEffect, useState } from "react";
import SidebarLayout from "./components/SidebarLayout";
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
}

interface DashboardStats {
  yearlyStats: Array<{
    year: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  currentMonthStats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    backlog: number;
  };
  priorityBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  currentYear: number;
  currentMonth: number;
  currentMonthName: string;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, filter]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '8',
        ...(filter !== 'all' && { status: filter })
      });
      
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalTasks(data.pagination?.totalTasks || 0);
      }
    } catch (error) {
    }
    setLoading(false);
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    const result = await Swal.fire({
      title: "Delete Task",
      text: `Are you sure you want to delete "${taskTitle}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Task has been deleted",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchTasks();
        } else {
          const data = await res.json();
          await Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: data.error,
          });
        }
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete task",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-900/30 border-green-600 text-green-400";
      case "in_progress":
        return "bg-blue-900/30 border-blue-600 text-blue-400";
      case "todo":
        return "bg-yellow-900/30 border-yellow-600 text-yellow-400";
      case "backlog":
        return "bg-gray-900/30 border-gray-600 text-gray-400";
      default:
        return "bg-gray-900/30 border-gray-600 text-gray-400";
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

  const tasksByStatus = {
    backlog: tasks.filter((t) => t.status === "backlog").length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Overview of all your tasks and progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.totalTasks || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.completedTasks || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-white mt-2">{stats?.completionRate || 0}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-2xl">
                📈
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Tasks</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {(stats?.totalTasks || 0) - (stats?.completedTasks || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-900/30 flex items-center justify-center text-2xl">
                ⚡
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-2">Task History (Per Year)</h2>
            <p className="text-sm text-gray-400 mb-4">
              {stats?.yearlyStats && stats.yearlyStats.length > 0 
                ? `${stats.yearlyStats[0].year} - ${stats.yearlyStats[stats.yearlyStats.length - 1].year}`
                : 'Last 5 years'}
            </p>
            <div className="space-y-4">
              {stats?.yearlyStats.map((yearStat) => (
                <div key={yearStat.year}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">{yearStat.year}</span>
                    <span className="text-sm text-gray-400">
                      {yearStat.completed}/{yearStat.total} tasks ({yearStat.completionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${yearStat.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Active Tasks by Priority</h2>
            <div className="space-y-4">
              {[
                { label: 'Urgent', value: stats?.priorityBreakdown.urgent || 0, color: 'bg-red-600' },
                { label: 'High', value: stats?.priorityBreakdown.high || 0, color: 'bg-orange-500' },
                { label: 'Medium', value: stats?.priorityBreakdown.medium || 0, color: 'bg-yellow-500' },
                { label: 'Low', value: stats?.priorityBreakdown.low || 0, color: 'bg-green-500' }
              ].map((priority) => {
                const total = Object.values(stats?.priorityBreakdown || {}).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((priority.value / total) * 100) : 0;
                return (
                  <div key={priority.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium">{priority.label}</span>
                      <span className="text-sm text-gray-400">{priority.value} tasks ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`${priority.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">
            Current Month Progress ({stats?.currentMonthName || 'Loading...'})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats?.currentMonthStats.total || 0}</p>
              <p className="text-sm text-gray-400 mt-1">Total</p>
            </div>
            <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-600">
              <p className="text-2xl font-bold text-green-400">{stats?.currentMonthStats.completed || 0}</p>
              <p className="text-sm text-green-300 mt-1">Done</p>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-4 text-center border border-blue-600">
              <p className="text-2xl font-bold text-blue-400">{stats?.currentMonthStats.inProgress || 0}</p>
              <p className="text-sm text-blue-300 mt-1">In Progress</p>
            </div>
            <div className="bg-yellow-900/30 rounded-lg p-4 text-center border border-yellow-600">
              <p className="text-2xl font-bold text-yellow-400">{stats?.currentMonthStats.todo || 0}</p>
              <p className="text-sm text-yellow-300 mt-1">To Do</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center border border-gray-600">
              <p className="text-2xl font-bold text-gray-400">{stats?.currentMonthStats.backlog || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Backlog</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Backlog</p>
                <p className="text-3xl font-bold text-white mt-2">{tasksByStatus.backlog}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">To Do</p>
                <p className="text-3xl font-bold text-white mt-2">{tasksByStatus.todo}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-white mt-2">{tasksByStatus.in_progress}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-2xl">
                ⚙️
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Done</p>
                <p className="text-3xl font-bold text-white mt-2">{tasksByStatus.done}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-400 font-medium">Filter by Status:</span>
            <div className="bg-gray-800 rounded-xl p-2 inline-flex gap-2 border border-gray-700">
              {["all", "backlog", "todo", "in_progress", "done"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Tasks ({totalTasks} total)
              </h2>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg">No tasks found</p>
              <p className="text-sm mt-2">
                {filter !== 'all'
                  ? 'Try adjusting your filter' 
                  : 'Create your first task to get started!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-6 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {task.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-lg border ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status.replace("_", " ").toUpperCase()}
                        </span>

                        {task.due_date && (
                          <span className="text-gray-400 flex items-center gap-1">
                            📅{" "}
                            {new Date(task.due_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}

                        {task.google_calendar_event_id && (
                          <span className="text-blue-400 flex items-center gap-1">
                            🗓️ Synced
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(task._id, task.title)}
                        className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && tasks.length > 0 && totalPages > 1 && (
            <div className="p-6 border-t border-gray-700">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2 py-2 text-gray-500">...</span>
                        )}
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {page}
                        </button>
                      </>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
