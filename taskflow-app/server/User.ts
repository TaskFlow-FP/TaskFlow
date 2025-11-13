import { Model, IMongoloquentSchema, IMongoloquentTimestamps } from "mongoloquent";
import Project from "./Project";
import Task from "./Task";

interface IUser extends IMongoloquentSchema, IMongoloquentTimestamps {
  google_id?: string
  email: string
  full_name: string
  password?: string
  google_access_token?: string
  google_refresh_token?: string
}

export default class User extends Model<IUser> {

  public static $schema: IUser;

  protected $collection: string = "users";

  public projects() {
    return this.belongsToMany(Project, 'members', 'userId', 'projectId');
  }

  public ownedProjects() {
    return this.hasMany(Project, "ownerId", "_id");
  }

  public tasks() {
    return this.belongsToMany(Task, 'task_users', 'userId', 'taskId');
  }
}