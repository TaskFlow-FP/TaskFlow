"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { useParams, useRouter } from "next/navigation";
import { ITask } from "./page";

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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600 hover:border-blue-500 cursor-grab active:cursor-grabbing touch-none transition-colors"
        >
            <div className="flex justify-between items-start mb-2">
                <h4 
                    onClick={handleClick}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="font-bold text-white pr-2 cursor-pointer hover:text-blue-400 transition-colors"
                >
                    {task.title}
                </h4>
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