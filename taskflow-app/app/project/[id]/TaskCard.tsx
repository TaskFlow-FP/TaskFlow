// app/project/[id]/TaskCard.tsx
"use client";

import { useRouter } from 'next/navigation';

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string | null;
  google_calendar_event_id?: string | null;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-gray-900';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const formatDueDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-400' };
  if (diffDays === 0) return { text: 'Due today', color: 'text-yellow-400' };
  if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-blue-400' };
  if (diffDays <= 7) return { text: `${diffDays}d left`, color: 'text-green-400' };
  return { text: date.toLocaleDateString(), color: 'text-gray-400' };
};

export default function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const dueInfo = formatDueDate(task.due_date);

  return (
    <div 
      onClick={() => router.push(`/task/${task._id}`)}
      className="bg-gray-700 p-4 rounded-lg shadow-md mb-4 border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white pr-2">{task.title}</h4>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      {dueInfo && (
        <div className="flex items-center gap-2 text-xs mt-2">
          <span className="text-gray-400">📅</span>
          <span className={dueInfo.color}>{dueInfo.text}</span>
          {task.google_calendar_event_id && (
            <span className="text-blue-400" title="Synced with Google Calendar">🗓️</span>
          )}
        </div>
      )}
    </div>
  );
}