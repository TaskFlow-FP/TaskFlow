"use client";

import { useEffect, useState } from 'react';
import { ITask } from './page';
import TaskCard from './TaskCard';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
const columns = [
    { id: 'backlog', title: 'Backlog', color: '#6b7280' },
    { id: 'todo', title: 'To Do', color: '#ef4444' },
    { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'done', title: 'Complete', color: '#22c55e' }
];

const priorityOrder: { [key: string]: number } = {
    'urgent': 1,
    'high': 2,
    'medium': 3,
    'low': 4
};

const groupTasksByColumn = (tasks: ITask[]) => {
    const grouped: { [key: string]: ITask[] } = {};
    columns.forEach(col => grouped[col.id] = []);
    tasks.forEach(task => {
        if (grouped[task.status]) {
            grouped[task.status].push(task);
        }
    });
    
    Object.keys(grouped).forEach(status => {
        grouped[status].sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 999;
            const priorityB = priorityOrder[b.priority] || 999;
            return priorityA - priorityB;
        });
    });
    
    return grouped;
};

export default function TaskBoard({ tasks }: { tasks: ITask[] }) {
    const [tasksByColumn, setTasksByColumn] = useState(groupTasksByColumn(tasks));
    const [activeTask, setActiveTask] = useState<ITask | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = Object.values(tasksByColumn)
            .flat()
            .find(t => t._id === active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        
        let newStatus: string;
        if (over.data.current?.sortable?.containerId) {
            newStatus = over.data.current.sortable.containerId;
        } else {
            newStatus = over.id as string;
        }

        const validColumns = columns.map(col => col.id);
        if (!validColumns.includes(newStatus)) {
            console.warn('Drop ignored - not a valid column:', newStatus);
            return;
        }

        let currentStatus = '';
        for (const [status, taskList] of Object.entries(tasksByColumn)) {
            if (taskList.some(t => t._id === taskId)) {
                currentStatus = status;
                break;
            }
        }

        if (!currentStatus || currentStatus === newStatus) return;

        const originalTasks = { ...tasksByColumn };

        setTasksByColumn(prev => {
            const newTasks = { ...prev };
            const task = newTasks[currentStatus]?.find(t => t._id === taskId);
            
            if (!task || !newTasks[newStatus]) return prev;

            newTasks[currentStatus] = newTasks[currentStatus].filter(t => t._id !== taskId);
            
            const updatedTask = { ...task, status: newStatus };
            
            newTasks[newStatus] = [...newTasks[newStatus], updatedTask].sort((a, b) => {
                const priorityA = priorityOrder[a.priority] || 999;
                const priorityB = priorityOrder[b.priority] || 999;
                return priorityA - priorityB;
            });
            
            return newTasks;
        });

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(errorData.error || "Server update failed");
            }
            
            const result = await response.json();
            console.log('Task updated successfully:', result);
        } catch (error) {
            console.error('Failed to update task:', error);
            setTasksByColumn(originalTasks);
            alert("Failed to move task. Changes have been reverted.");
        }
    };

    // Prevent hydration mismatch by only rendering DndContext on client
    if (!isMounted) {
        return (
            <div className="flex gap-6 overflow-x-auto pb-4">
                {columns.map(column => (
                    <div 
                        key={column.id}
                        className="min-w-[360px] flex-shrink-0"
                    >
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
                            <h2 className="font-semibold text-gray-900">{column.title}</h2>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                {tasksByColumn[column.id]?.length || 0}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {tasksByColumn[column.id]?.map(task => (
                                <TaskCard key={task._id} task={task} />
                            ))}
                            {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                                <div className="flex items-center justify-center h-32 text-center text-gray-400">
                                    <p className="text-sm">Drop tasks here</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-4">
                {columns.map(column => (
                    <DroppableColumn 
                        key={column.id} 
                        column={column} 
                        tasks={tasksByColumn[column.id] || []}
                    />
                ))}
            </div>
            
            <DragOverlay>
                {activeTask ? (
                    <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 opacity-90">
                        <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900 pr-2">{activeTask.title}</h4>
                            <span className="px-2 py-1 text-xs font-medium rounded">
                                {activeTask.priority}
                            </span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function DroppableColumn({ column, tasks }: { column: { id: string; title: string; color: string }, tasks: ITask[] }) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div className="min-w-[360px] flex-shrink-0">
            <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
                <h2 className="font-semibold text-gray-900">{column.title}</h2>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    {tasks.length}
                </span>
            </div>

            <div 
                ref={setNodeRef}
                className={`transition-colors rounded-lg ${
                    isOver ? 'bg-gray-50' : ''
                }`}
                style={{ minHeight: '400px' }}
            >
                <SortableContext
                    items={tasks.map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <TaskCard key={task._id} task={task} />
                        ))}
                        
                        {tasks.length === 0 && (
                            <div className="flex items-center justify-center h-32 text-center text-gray-400">
                                <p className="text-sm">Drop tasks here</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}