import { NextRequest, NextResponse } from "next/server";
import Comment from "@/server/Comment";
import Task from "@/server/Task";
import Project from "@/server/Project";
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
        const commentInstance = new Comment();
        Object.assign(commentInstance, comment);
        const user = await commentInstance.user().first();
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

    const project = new Project();
    Object.assign(project, projectData);
    
    const members = await project.members().get();
    const isMember = members.some(
      (member: any) => member._id.toString() === userId.toString()
    );
    const isOwner = project.ownerId.toString() === userId.toString();

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
    const comment = new Comment();
    Object.assign(comment, commentData);
    const user = await comment.user().first();
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
    notifier.notifyCommentCreated(validated.taskId, commentWithUser);

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
