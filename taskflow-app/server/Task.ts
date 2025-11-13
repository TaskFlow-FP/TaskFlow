import { ObjectId } from "mongodb";
import { Model, IMongoloquentSchema, IMongoloquentTimestamps } from "mongoloquent";
import User from "./User";
import Project from "./Project";

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface ITask extends IMongoloquentSchema, IMongoloquentTimestamps {
    projectId: ObjectId 
    title: string
    description?: string
    status: TaskStatus
    priority: TaskPriority
    due_date?: Date
    google_calendar_event_id?: string
}

export default class Task extends Model<ITask> {

  public static $schema: ITask

  protected $collection: string = "tasks";

  public project() {
    return this.belongsTo(Project, "projectId", "_id");
  }

  public assignedUsers() {
    return this.belongsToMany(User, "task_users", 'taskId', 'userId');
  }
}