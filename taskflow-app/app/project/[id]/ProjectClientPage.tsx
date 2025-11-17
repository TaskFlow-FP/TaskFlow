"use client"

import { useState } from "react";
import { ProjectDetails } from './page';
import TaskBoard from "./TaskBoard";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function ProjectClientPage({ initialData }: { initialData: ProjectDetails }) {
  const [project, setProject] = useState(initialData.project);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [members, setMembers] = useState(initialData.members);
  const [activeTab, setActiveTab] = useState('tasks');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Project",
      text: `Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all tasks and members.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      try {
        const resp = await fetch(`http://localhost:3000/api/projects/${project._id}`, {
          method: 'DELETE'
        })

        if (resp.ok) {
          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Project has been deleted successfully",
            timer: 1500,
            showConfirmButton: false,
          });
          router.push('/project');
          router.refresh();
        } else {
          const data = await resp.json();
          await Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: data.error || "Failed to delete project",
          });
        }
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while deleting the project",
        });
      }
    }
  }

  const handleOpenEditModal = () => {
    setEditFormData({
      name: project.name,
      description: project.description || ''
    })
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditFormData({ name: '', description: '' })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const resp = await fetch(`http://localhost:3000/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      })
    
      if (resp.ok) {
        const updatedProject = await resp.json()
        setProject(updatedProject)
        handleCloseEditModal()
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Project updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        router.refresh();
      } else {
        const data = await resp.json();
        await Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: data.error || "Failed to update project",
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the project",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
        <p className="text-gray-400 max-w-3xl">{project.description || "No description."}</p>
        <div className="text-sm text-gray-500 mt-2">
          Owned by: {project.owner.full_name}
        </div>
      </div>
      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleOpenEditModal}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Edit Project
        </button>
        <button 
          onClick={handleDelete}
          className="bg-red-900/50 hover:bg-red-900/70 text-red-300 font-bold py-2 px-4 rounded-lg transition"
        >
          Delete Project
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Invite Member</button>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Project</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border-b border-gray-700 mb-8">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            Members ({members.length})
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'tasks' && (
          <TaskBoard tasks={tasks} />
        )}
        {activeTab === 'chat' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Project Chat</h2>
            <p className="text-gray-400">Placeholder for ChatBox component.</p>
          </div>
        )}
        {activeTab === 'members' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Project Members</h2>
            <ul className="divide-y divide-gray-700">
              {members.map(member => (
                <li key={member._id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{member.user.full_name}</p>
                    <p className="text-gray-400 text-sm">{member.user.email}</p>
                  </div>
                  <span className="text-xs font-bold uppercase bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{member.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}