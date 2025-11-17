import { NextRequest, NextResponse } from "next/server";
import Task from "@/server/Task";
import Member from "@/server/Member";
import { ObjectId } from "mongodb";
import TaskNotifier from "@/server/TaskNotifier";
import { getCurrentUser } from "@/helpers/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(req);
    const { id } = await params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const { status } = body;
    
    if (!status || !['backlog', 'todo', 'in_progress', 'done'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: backlog, todo, in_progress, or done" },
        { status: 400 }
      );
    }

    const task = await Task.where('_id', new ObjectId(id)).first();
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user is member of the project
    const membership = await Member.query()
      .where('userId', new ObjectId(currentUser.id))
      .where('projectId', task.projectId)
      .where('invitation_status', 'accepted')
      .first();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    await Task.where('_id', new ObjectId(id)).update({ status });
    
    const updatedTask = await Task.where('_id', new ObjectId(id)).first();

    const notifier = TaskNotifier.getInstance();
    notifier.notifyTaskUpdated(id, updatedTask);

    return NextResponse.json(
      { message: "Task status updated successfully", task: updatedTask },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === "Not authenticated" || error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(req);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await Task.where('_id', new ObjectId(id)).first();
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user is member of the project
    const membership = await Member.query()
      .where('userId', new ObjectId(currentUser.id))
      .where('projectId', task.projectId)
      .where('invitation_status', 'accepted')
      .first();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    await Task.destroy(new ObjectId(id));

    const notifier = TaskNotifier.getInstance();
    notifier.notifyTaskDeleted(id);

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === "Not authenticated" || error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.errors) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete task", details: error.message },
      { status: 500 }
    );
  }
}
