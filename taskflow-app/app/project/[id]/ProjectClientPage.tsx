"use client"

import { useState } from "react";
import { ProjectDetails } from './page'

export default function ProjectClientPage({ initialData }: { initialData: ProjectDetails }) {
  const [project, setProject] = useState(initialData.project);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [members, setMembers] = useState(initialData.members);
  
  const [activeTab, setActiveTab] = useState('tasks');

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
        <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">Edit Project</button>
        <button className="bg-red-900/50 hover:bg-red-900/70 text-red-300 font-bold py-2 px-4 rounded-lg transition">Delete Project</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Invite Member</button>
      </div>

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
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white">Task Kanban Board</h2>
            <p className="text-gray-400 mt-2">
              Placeholder for Task Board. {tasks.length} tasks loaded.
            </p>
          </div>
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