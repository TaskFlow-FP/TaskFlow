// app/project/[id]/TaskBoard.tsx
"use client";

import { ITask } from './page';
import TaskCard from './TaskCard';

const columns = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

export default function TaskBoard({ tasks }: { tasks: ITask[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map(column => (
        <div key={column.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white">{column.title}</h3>
            <button className="text-blue-400 hover:text-blue-300 text-2xl font-bold">+</button>
          </div>

          <div>
            {tasks
              .filter(task => task.status === column.id)
              .map(task => (
                <TaskCard key={task._id} task={task} />
              ))}
            
            {tasks.filter(task => task.status === column.id).length === 0 && (
                <div className="text-center text-gray-500 pt-8 pb-4">
                    <p>No tasks in this column.</p>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}