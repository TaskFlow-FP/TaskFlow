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

            {task.due_date && (
                <p className="text-gray-500 text-xs">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}