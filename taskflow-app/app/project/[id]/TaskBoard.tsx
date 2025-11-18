"use client";

import { useEffect, useState } from 'react';
import { ITask } from './page';
import TaskCard from './TaskCard';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
                {columns.map(column => (
                    <div 
                        key={column.id}
                        className="bg-gray-800 rounded-xl p-4 border-2 border-gray-700"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-white">{column.title}</h3>
                            <span className="text-gray-400 text-sm">{tasksByColumn[column.id]?.length || 0}</span>
                        </div>
                        <div className="space-y-3 min-h-[400px] p-2">
                            {tasksByColumn[column.id]?.map(task => (
                                <TaskCard key={task._id} task={task} />
                            ))}
                            {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                                <div className="flex items-center justify-center h-full text-center text-gray-500">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
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
                    <div className="bg-gray-700 p-4 rounded-lg shadow-lg border border-gray-600 opacity-90">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white pr-2">{activeTask.title}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full`}>
                                {activeTask.priority}
                            </span>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function DroppableColumn({ column, tasks }: { column: { id: string; title: string }, tasks: ITask[] }) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div 
            ref={setNodeRef} 
            className={`flex flex-col bg-gray-800 rounded-xl border-2 transition-colors ${
                isOver ? 'border-blue-500 bg-gray-700' : 'border-gray-700'
            }`}
            style={{ minHeight: '300px' }}
        >
            <div className="flex justify-between items-center p-4 pb-2">
                <h3 className="font-bold text-lg text-white">{column.title}</h3>
                <span className="text-gray-400 text-sm">{tasks.length}</span>
            </div>

            <SortableContext
                items={tasks.map(t => t._id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 p-4 pt-2 space-y-3 min-h-[200px]">
                    {tasks.map(task => (
                        <TaskCard key={task._id} task={task} />
                    ))}
                    
                    {tasks.length === 0 && (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <p className="text-sm">Drop tasks here</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}