import { ObjectId } from "mongodb";
import { Model, IMongoloquentSchema, IMongoloquentTimestamps } from "mongoloquent";
import User from "./User";
import Project from "./Project";

export type ProjectRole = 'owner' | 'editor' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

interface IMember extends IMongoloquentSchema, IMongoloquentTimestamps {
    userId: ObjectId
    projectId: ObjectId
    role: ProjectRole
    invitation_status: InvitationStatus
    joined_at?: Date
}

export default class Member extends Model<IMember> {

  public static $schema: IMember

  protected $collection: string = "members";

  public user() {
    return this.belongsTo(User, "userId", "_id");
  }

  public project() {
    return this.belongsTo(Project, "projectId", "_id");
  }
}