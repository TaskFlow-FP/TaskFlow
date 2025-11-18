"use client"

import { useState } from "react";
import { ProjectDetails } from './page';
import TaskBoard from "./TaskBoard";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { email } from "zod";

export default function ProjectClientPage({ initialData }: { initialData: ProjectDetails }) {
  const [project, setProject] = useState(initialData.project);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [members, setMembers] = useState(initialData.members);
  const [activeTab, setActiveTab] = useState('tasks');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  })
  const [inviteEmail, setInviteEmail] = useState("")
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

  const handleOpenInviteModal = () => {
    setInviteEmail('')
    setIsInviteModalOpen(true)
  }

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false)
    setInviteEmail('')
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const resp = await fetch(`http://localhost:3000/api/projects/${project._id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail })
      })

      const data = await resp.json()

      if (resp.ok) {
        handleCloseInviteModal()
        await Swal.fire({
          icon: "success",
          title: "Invitation Sent!",
          text: `An invitation has been sent to ${inviteEmail}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Invitation Failed",
          text: data.error || "Failed to send invitation",
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while sending the invitation",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">{project.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{project.description || "No description."}</p>
        <div className="text-sm text-gray-500">
          Owned by: {project.owner.full_name}
        </div>
        
        <div className="flex items-center space-x-8 mt-6 border-t border-gray-200 pt-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'tasks'
                ? 'text-gray-900 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'members'
                ? 'text-gray-900 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Members ({members.length})
          </button>
          <div className="ml-auto flex items-center space-x-4">
            <button 
              onClick={handleOpenEditModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Edit
            </button>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Delete
            </button>
            <button 
              onClick={handleOpenInviteModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              + Invite
            </button>
          </div>
        </div>
      </header>
      
      <main className="p-8">
        {activeTab === 'tasks' && (
          <TaskBoard tasks={tasks} />
        )}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Members</h2>
            <ul className="divide-y divide-gray-200">
              {members.map(member => (
                <li key={member._id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-gray-900 font-medium">{member.full_name}</p>
                    <p className="text-gray-600 text-sm">{member.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      
      {/* Modals remain the same but need to be moved after main */}
      <div className="hidden">
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

      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Invite Member</h2>
            
            <form onSubmit={handleInviteSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user's email"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-2 text-sm text-gray-400">
                  An invitation email will be sent to this address
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
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


    </div>
  );
}