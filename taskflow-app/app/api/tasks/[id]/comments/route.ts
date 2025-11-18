import { NextRequest, NextResponse } from "next/server";
import Comment from "@/server/Comment";
import Task from "@/server/Task";
import Project from "@/server/Project";
import Member from "@/server/Member";
import User from "@/server/User";
import TaskNotifier from "@/server/TaskNotifier";
import { commentCreateSchema } from "@/server/schemas/commentSchema";
import { ObjectId } from "mongodb";
import { getUserIdFromToken } from "@/helpers/auth";

// GET all comments for a task
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    // Check if task exists
    const task = await Task.where('_id', new ObjectId(taskId)).first();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get all comments for this task
    const rawComments = await Comment.query()
      .where('taskId', new ObjectId(taskId))
      .orderBy('createdAt', 'desc')
      .get();

    // Populate user information for each comment
    const commentsWithUsers = await Promise.all(
      rawComments.map(async (comment) => {
        const user = await User.where('_id', comment.userId).first();
        return {
          _id: comment._id,
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: user ? {
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
          } : null,
        };
      })
    );

    return NextResponse.json({ comments: commentsWithUsers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await req.json();

    // Get user ID from auth token
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    // Validate comment data
    const validated = commentCreateSchema.parse({
      taskId,
      content: body.content,
    });

    // Check if task exists
    const task = await Task.where('_id', new ObjectId(taskId)).first();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user is a member of the project
    const projectData = await Project.where('_id', task.projectId).first();
    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    console.log('[Comment Auth] Checking authorization for user:', userId);
    console.log('[Comment Auth] Project ID:', task.projectId.toString());

    // Query members directly instead of using relations
    const members = await Member.where('projectId', task.projectId).get();
    
    console.log('[Comment Auth] Project members:', members.map((m: any) => ({
      userId: m.userId?.toString(),
      status: m.invitation_status,
      role: m.role
    })));
    
    const isMember = members.some(
      (member: any) => 
        member.userId?.toString() === userId.toString() && 
        member.invitation_status === 'accepted'
    );
    const isOwner = projectData.ownerId.toString() === userId.toString();

    console.log('[Comment Auth] isMember:', isMember, 'isOwner:', isOwner);

    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "You must be a project member to comment on tasks" },
        { status: 403 }
      );
    }

    // Create comment
    const commentData = await Comment.create({
      taskId: new ObjectId(validated.taskId),
      userId: new ObjectId(userId),
      content: validated.content,
    });

    // Get user info for response
    const user = await User.where('_id', new ObjectId(userId)).first();
    const commentWithUser = {
      _id: commentData._id,
      taskId: commentData.taskId,
      userId: commentData.userId,
      content: commentData.content,
      createdAt: commentData.createdAt,
      updatedAt: commentData.updatedAt,
      user: user ? {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
      } : null,
    };

    // Notify via SSE
    const notifier = TaskNotifier.getInstance();
    const taskIdString = commentData.taskId.toString();
    console.log('[SSE] Notifying comment created:', {
      taskId: taskIdString,
      commentId: commentData._id.toString(),
      user: user?.full_name,
      connectionCount: notifier.getConnectionCount()
    });
    notifier.notifyCommentCreated(taskIdString, commentWithUser);

    return NextResponse.json(
      { message: "Comment created successfully", comment: commentWithUser },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create comment", details: error.message },
      { status: 500 }
    );
  }
}
