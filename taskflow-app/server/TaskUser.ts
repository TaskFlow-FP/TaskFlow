import { ObjectId } from "mongodb";
import { Model, IMongoloquentSchema, IMongoloquentTimestamps } from "mongoloquent";
import User from "./User";
import Task from "./Task";

interface ITaskUser extends IMongoloquentSchema, IMongoloquentTimestamps {
  userId: ObjectId;
  taskId: ObjectId;
}

export default class TaskUser extends Model<ITaskUser> {

  public static $schema: ITaskUser;

  protected $collection: string = "task_users";

  public user() {
    return this.belongsTo(User, "userId", "_id");
  }

  public task() {
    return this.belongsTo(Task, "taskId", "_id");
  }
}