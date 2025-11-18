"use client"

import { useState, useEffect } from "react";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description || '');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const router = useRouter()

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/users/me');
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
      }
    };
    fetchCurrentUser();
  }, []);

  // Check if current user is the owner
  const isOwner = currentUserId && project.owner._id === currentUserId;

  // SSE for real-time member updates
  useEffect(() => {
    const eventSource = new EventSource('/api/tasks/stream');

    eventSource.addEventListener('member_joined', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        
        // Only update if this is our project
        if (data.projectId === project._id) {
          // Add new member to the list
          setMembers(prevMembers => {
            // Check if member already exists
            const exists = prevMembers.some((m: any) => m._id === data.member._id);
            if (exists) {
              // Update existing member
              return prevMembers.map((m: any) => 
                m._id === data.member._id ? data.member : m
              );
            } else {
              // Add new member
              return [...prevMembers, data.member];
            }
          });
          
        }
      } catch (error) {
      }
    });

    eventSource.addEventListener('error', () => {
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [project._id]);

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

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Project name cannot be empty",
      });
      setEditedName(project.name);
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch(`http://localhost:3000/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName, description: project.description })
      });

      if (resp.ok) {
        const data = await resp.json();
        setProject(data.project);
        setIsEditingName(false);
        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Project name updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const data = await resp.json();
        setEditedName(project.name);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Failed to update project name",
        });
      }
    } catch (error) {
      setEditedName(project.name);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update project name",
      });
    }
    setIsSubmitting(false);
  };

  const handleSaveDescription = async () => {
    setIsSubmitting(true);
    try {
      const resp = await fetch(`http://localhost:3000/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: project.name, description: editedDescription })
      });

      if (resp.ok) {
        const data = await resp.json();
        setProject(data.project);
        setIsEditingDescription(false);
        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Project description updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const data = await resp.json();
        setEditedDescription(project.description || '');
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Failed to update project description",
        });
      }
    } catch (error) {
      setEditedDescription(project.description || '');
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update project description",
      });
    }
    setIsSubmitting(false);
  };

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
        
        // Show message based on notification method
        if (data.emailSent) {
          await Swal.fire({
            icon: "success",
            title: "Invitation Sent!",
            html: `
              <p>✅ Invitation sent to <strong>${inviteEmail}</strong></p>
              <p class="text-sm text-gray-600 mt-2">📧 Email notification sent</p>
              <p class="text-sm text-gray-600">📱 Also available in their Invitations page</p>
            `,
            confirmButtonText: "OK",
            confirmButtonColor: "#3b82f6",
          });
        } else {
          await Swal.fire({
            icon: "success",
            title: "Invitation Created!",
            html: `
              <p>✅ Invitation created for <strong>${inviteEmail}</strong></p>
              <p class="text-sm text-gray-600 mt-2">
                📱 They can accept the invitation from their <strong>Invitations</strong> page
              </p>
              <p class="text-sm text-gray-500 mt-2">
                💡 The invitation will appear automatically when they log in
              </p>
            `,
            confirmButtonText: "OK",
            confirmButtonColor: "#3b82f6",
          });
        }
        
        // Refresh the page to show new member in pending state
        router.refresh();
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
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{project.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setEditedName(project.name);
                        setIsEditingName(false);
                      }
                    }}
                    className="text-2xl font-bold text-gray-900 border-2 border-indigo-500 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSubmitting}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                    title="Save"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditedName(project.name);
                      setIsEditingName(false);
                    }}
                    disabled={isSubmitting}
                    className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-gray-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Edit project name"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isEditingDescription ? (
          <div className="mb-4">
            <div className="flex flex-col gap-2">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditedDescription(project.description || '');
                    setIsEditingDescription(false);
                  }
                }}
                className="text-sm text-gray-600 border-2 border-indigo-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                placeholder="Add a description..."
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDescription}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditedDescription(project.description || '');
                    setIsEditingDescription(false);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 group">
            <div className="flex items-start gap-2">
              <p className="text-sm text-gray-600 flex-1">{project.description || "No description."}</p>
              {isOwner && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="p-1.5 text-gray-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Edit description"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-4">
          Owned by: {project.owner.full_name}
        </div>
        
        <div className="flex items-center space-x-8 mt-6 border-t border-gray-200 pt-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'tasks'
                ? 'text-gray-900 border-b-2 border-indigo-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'members'
                ? 'text-gray-900 border-b-2 border-indigo-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Members ({members.length})
          </button>
          <div className="ml-auto flex items-center space-x-4">
            {isOwner && (
              <>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button 
                  onClick={handleOpenInviteModal}
                  className="px-5 py-2.5 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Invite Member
                </button>
              </>
            )}
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
      
      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-lg border-2 border-gray-700 shadow-2xl animate-slideUp">
            {/* Header with icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Invite Member</h2>
                <p className="text-gray-400 text-sm">Add a collaborator to your project</p>
              </div>
            </div>
            
            <form onSubmit={handleInviteSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <p className="mt-3 text-sm text-gray-400 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>An invitation will be sent to this email address. They can also accept from their Invitations page.</span>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}