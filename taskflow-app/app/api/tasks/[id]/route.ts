import { NextRequest, NextResponse } from "next/server";
import Task from "@/server/Task";
import Project from "@/server/Project";
import Member from "@/server/Member";
import User from "@/server/User";
import TaskUser from "@/server/TaskUser";
import { ObjectId } from "mongodb";
import TaskNotifier from "@/server/TaskNotifier";
import { getCurrentUser } from "@/helpers/auth";
import { updateCalendarEvent } from "@/helpers/googleCalendar";

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

    // Auto-update Google Calendar if task is synced
    try {
      const taskUsers = await TaskUser.query()
        .where('taskId', new ObjectId(id))
        .where('google_calendar_event_id', { $exists: true, $ne: null })
        .get();

      if (taskUsers.length > 0 && updatedTask?.due_date) {
        const project = await Project.where("_id", updatedTask.projectId).first();
        
        for (const taskUser of taskUsers) {
          if (taskUser.google_calendar_event_id) {
            const user = await User.where("_id", taskUser.userId).first();
            if (user?.google_access_token) {
              try {
                await updateCalendarEvent(
                  user.google_access_token,
                  taskUser.google_calendar_event_id,
                  {
                    taskTitle: updatedTask.title,
                    taskDescription: updatedTask.description || "",
                    projectName: project?.name,
                    status: updatedTask.status,
                    priority: updatedTask.priority,
                    dueDate: new Date(updatedTask.due_date),
                  }
                );
              } catch (calError) {
                console.error(`Failed to update calendar for user ${taskUser.userId}:`, calError);
              }
            }
          }
        }
      }
    } catch (calError) {
      console.error('Calendar update error:', calError);
      // Don't fail the request if calendar update fails
    }

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
