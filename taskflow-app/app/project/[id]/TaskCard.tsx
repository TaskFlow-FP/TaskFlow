// app/project/[id]/TaskCard.tsx
"use client";

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
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

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-4 border border-gray-600">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-white pr-2">{task.title}</h4>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}