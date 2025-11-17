import { ObjectId } from "mongodb";
import { Model, IMongoloquentSchema, IMongoloquentTimestamps } from "mongoloquent";
import User from "./User";
import Task from "./Task";

interface IComment extends IMongoloquentSchema, IMongoloquentTimestamps {
    taskId: ObjectId;
    userId: ObjectId;
    content: string;
}

export default class Comment extends Model<IComment> {

  public static $schema: IComment;

  protected $collection: string = "comments";

  public user() {
    return this.belongsTo(User, "userId", "_id");
  }

  public task() {
    return this.belongsTo(Task, "taskId", "_id");
  }
}
