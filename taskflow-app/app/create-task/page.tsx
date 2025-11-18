"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "../components/SidebarLayout";
import Swal from "sweetalert2";
import { z } from "zod";

const taskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["backlog", "todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
});

interface Project {
  _id: string;
  name: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof taskSchema>>({
    projectId: "",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
  });

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => data.projects && setProjects(data.projects))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = taskSchema.safeParse(formData);
    if (!validation.success) {
      Swal.fire("Validation Error", validation.error.issues[0].message, "warning");
      return;
    }

    setLoading(true);
    try {
      let finalFormData = { ...formData };

      if (useAI) {
        const aiRes = await fetch("/api/ai/prioritize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            dueDate: formData.due_date,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          finalFormData.priority = aiData.priority;
        }
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: finalFormData.projectId,
          title: finalFormData.title,
          description: finalFormData.description,
          status: finalFormData.status,
          priority: finalFormData.priority,
          dueDate: finalFormData.due_date,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const taskId = data.task?._id || data._id;
        
        if (formData.due_date && taskId) {
          const result = await Swal.fire({
            title: "Task Created!",
            text: "Do you want to sync this task to Google Calendar?",
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Yes, sync to calendar",
            cancelButtonText: "View task",
            confirmButtonColor: "#3b82f6",
          });
          
          if (result.isConfirmed) {
            router.push(`/task/${taskId}?sync=true`);
          } else {
            router.push(`/task/${taskId}`);
          }
        } else {
          await Swal.fire({ 
            title: "Task Created", 
            icon: "success", 
            timer: 1500, 
            showConfirmButton: false 
          });
          router.push(taskId ? `/task/${taskId}` : "/");
        }
      } else {
        const data = await res.json();
        Swal.fire("Failed", data.error || "Something went wrong", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to create task", "error");
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = { urgent: "bg-red-600", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500" };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create New Task</h1>
          <p className="text-sm text-gray-600 mt-1">Add a new task to your project</p>
        </div>
        
        <div className="p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>📁 {p.name}</option>
                ))}
              </select>
              {formData.projectId && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Selected Project:</span>{" "}
                    {projects.find(p => p._id === formData.projectId)?.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Fix critical bug in login system"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the task in detail"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Use AI to determine priority
                    <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">AI</span>
                  </span>
                </label>
              </div>

              {!useAI && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          formData.priority === p
                            ? `${priorityColors[p]} text-white shadow-lg`
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
              >
                {loading ? "Creating..." : "Create Task"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </SidebarLayout>
  );
}
