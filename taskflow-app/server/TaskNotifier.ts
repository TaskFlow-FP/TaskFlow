type EventData = {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'comment_created' | 'comment_updated' | 'comment_deleted' | 'member_joined' | 'member_updated';
  taskId?: string;
  task?: any;
  commentId?: string;
  comment?: any;
  projectId?: string;
  member?: any;
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
    this.connections.forEach((callback, connectionId) => {
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

  notifyCommentCreated(taskId: string, comment: any) {
    this.broadcast({
      type: 'comment_created',
      taskId,
      comment,
      timestamp: new Date().toISOString()
    });
  }

  notifyCommentUpdated(commentId: string, comment: any) {
    this.broadcast({
      type: 'comment_updated',
      taskId: comment.taskId?.toString(),
      commentId,
      comment,
      timestamp: new Date().toISOString()
    });
  }

  notifyCommentDeleted(commentId: string, taskId: string) {
    this.broadcast({
      type: 'comment_deleted',
      commentId,
      taskId,
      timestamp: new Date().toISOString()
    });
  }

  notifyMemberJoined(projectId: string, member: any) {
    this.broadcast({
      type: 'member_joined',
      projectId,
      member,
      timestamp: new Date().toISOString()
    });
  }

  notifyMemberUpdated(projectId: string, member: any) {
    this.broadcast({
      type: 'member_updated',
      projectId,
      member,
      timestamp: new Date().toISOString()
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export default TaskNotifier;
