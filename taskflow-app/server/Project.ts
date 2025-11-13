import { ObjectId } from "mongodb";
import { Model, IMongoloquentSchema, IMongoloquentTimestamps } from "mongoloquent";
import User from "./User";
import Task from "./Task";

interface IProject extends IMongoloquentSchema, IMongoloquentTimestamps {
    name: string
    description?: string
    ownerId: ObjectId
}

export default class Project extends Model<IProject> {

  public static $schema: IProject;

  protected $collection: string = "projects";

  public owner() {
    return this.belongsTo(User, "ownerId", "_id");
  }
  
  public members() {
      return this.belongsToMany(User, 'members', 'projectId', 'userId');
  }

  public tasks() {
    return this.hasMany(Task, "projectId", "_id");
  }
}