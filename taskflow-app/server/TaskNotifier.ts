type EventData = {
  type: 'task_created' | 'task_updated' | 'task_deleted';
  taskId?: string;
  task?: any;
  timestamp: string;
};

class TaskNotifier {
  private static instance: TaskNotifier;
  private connections: Map<string, (data: EventData) => void>;

  private constructor() {
    this.connections = new Map();
  }

  static getInstance(): TaskNotifier {
    if (!TaskNotifier.instance) {
      TaskNotifier.instance = new TaskNotifier();
    }
    return TaskNotifier.instance;
  }

  addConnection(id: string, callback: (data: EventData) => void) {
    this.connections.set(id, callback);
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }

  broadcast(data: EventData) {
    this.connections.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
      }
    });
  }

  notifyTaskCreated(task: any) {
    this.broadcast({
      type: 'task_created',
      task,
      timestamp: new Date().toISOString()
    });
  }

  notifyTaskUpdated(taskId: string, task: any) {
    this.broadcast({
      type: 'task_updated',
      taskId,
      task,
      timestamp: new Date().toISOString()
    });
  }

  notifyTaskDeleted(taskId: string) {
    this.broadcast({
      type: 'task_deleted',
      taskId,
      timestamp: new Date().toISOString()
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export default TaskNotifier;
