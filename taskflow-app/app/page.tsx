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

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
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

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

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
          <p className="text-gray-400">Overview of all your tasks</p>
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

        <div className="bg-gray-800 rounded-xl p-2 mb-6 inline-flex gap-2 border border-gray-700">
          {["all", "backlog", "todo", "in_progress", "done"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
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

        {/* Tasks List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              Tasks ({filteredTasks.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg">No tasks found</p>
              <p className="text-sm mt-2">Create your first task to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredTasks.map((task) => (
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
        </div>
      </div>
    </SidebarLayout>
  );
}
