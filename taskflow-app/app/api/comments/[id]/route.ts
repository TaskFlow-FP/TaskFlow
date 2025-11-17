import { NextRequest, NextResponse } from "next/server";
import Comment from "@/server/Comment";
import TaskNotifier from "@/server/TaskNotifier";
import { commentUpdateSchema } from "@/server/schemas/commentSchema";
import { ObjectId } from "mongodb";
import { getUserIdFromToken } from "@/helpers/auth";

// PATCH update a comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const body = await req.json();

    // Get user ID from auth token
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    // Validate comment data
    const validated = commentUpdateSchema.parse({
      content: body.content,
    });

    // Check if comment exists
    const commentData = await Comment.where('_id', new ObjectId(commentId)).first();
    if (!commentData) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user owns the comment
    if (commentData.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update comment
    await Comment.where('_id', new ObjectId(commentId)).update({
      content: validated.content,
    });

    const updatedCommentData = await Comment.where('_id', new ObjectId(commentId)).first();
    
    // Get user info for response
    const comment = new Comment();
    Object.assign(comment, updatedCommentData);
    const user = await comment.user().first();
    
    const commentWithUser = {
      _id: updatedCommentData!._id,
      taskId: updatedCommentData!.taskId,
      userId: updatedCommentData!.userId,
      content: updatedCommentData!.content,
      createdAt: updatedCommentData!.createdAt,
      updatedAt: updatedCommentData!.updatedAt,
      user: user ? {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
      } : null,
    };

    // Notify via SSE
    const notifier = TaskNotifier.getInstance();
    notifier.notifyCommentUpdated(commentId, commentWithUser);

    return NextResponse.json(
      { message: "Comment updated successfully", comment: commentWithUser },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update comment", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;

    // Get user ID from auth token
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    // Check if comment exists
    const commentData = await Comment.where('_id', new ObjectId(commentId)).first();
    if (!commentData) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user owns the comment
    if (commentData.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Get taskId before deleting
    const taskIdForNotification = commentData.taskId.toString();

    // Delete comment
    await Comment.destroy(new ObjectId(commentId));

    // Notify via SSE
    const notifier = TaskNotifier.getInstance();
    notifier.notifyCommentDeleted(commentId, taskIdForNotification);

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete comment", details: error.message },
      { status: 500 }
    );
  }
}
