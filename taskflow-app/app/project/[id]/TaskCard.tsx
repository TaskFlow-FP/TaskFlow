"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { useParams, useRouter } from "next/navigation";
import { ITask } from "./page";
import { Calendar, Clock } from "lucide-react";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' };
    case 'high': return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High Priority' };
    case 'medium': return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Medium' };
    case 'low': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Low Priority' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Normal' };
  }
};

const getProgressInfo = (status: string) => {
  switch (status) {
    case 'backlog': return { percentage: 0, color: '#6b7280', text: '0/4' };
    case 'todo': return { percentage: 25, color: '#ef4444', text: '1/4' };
    case 'in_progress': return { percentage: 50, color: '#3b82f6', text: '2/4' };
    case 'done': return { percentage: 100, color: '#22c55e', text: '4/4' };
    default: return { percentage: 0, color: '#9ca3af', text: '0/4' };
  }
};

const formatDueDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600', urgent: true };
  if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-blue-600', urgent: false };
  if (diffDays <= 7) return { text: `${diffDays}d left`, color: 'text-green-600', urgent: false };
  return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-600', urgent: false };
};

export default function TaskCard({ task }: { task: ITask }) {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!isDragging) {
            router.push(`/task/${task._id}`);
        }
    };

    const dueInfo = formatDueDate(task.due_date);
    const priorityStyle = getPriorityColor(task.priority);
    const progress = getProgressInfo(task.status);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 flex-wrap">
                    <span className={`inline-block px-3 py-1 rounded text-[11px] font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
                        {priorityStyle.label}
                    </span>
                    {task.google_calendar_event_id && (
                        <span className="inline-block px-3 py-1 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                            Synced
                        </span>
                    )}
                </div>
                <span className="text-gray-400 cursor-pointer">⋯</span>
            </div>
            
            <h3 
                onClick={handleClick}
                onPointerDown={(e) => e.stopPropagation()}
                className="font-medium text-gray-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
            >
                {task.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description || 'No description provided'}
            </p>
            
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress.text}</span>
                </div>
                <div className="h-1 rounded-sm bg-gray-200">
                    <div 
                        className="h-full rounded-sm transition-all"
                        style={{ 
                            width: `${progress.percentage}%`,
                            backgroundColor: progress.color
                        }}
                    ></div>
                </div>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                    {dueInfo && (
                        <div className={`flex items-center gap-1 ${dueInfo.color}`}>
                            <Clock className="w-3 h-3" />
                            <span>{dueInfo.text}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>📎 0</span>
                    <span>💬 0</span>
                </div>
            </div>
        </div>
    );
}