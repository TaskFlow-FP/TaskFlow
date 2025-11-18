import { NextRequest, NextResponse } from "next/server";
import Task from "@/server/Task";
import User from "@/server/User";
import TaskUser from "@/server/TaskUser";
import { getCurrentUser } from "@/helpers/auth";
import { ObjectId } from "mongodb";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/helpers/googleCalendar";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const currentUser = getCurrentUser(req);
    const taskId = new ObjectId(params.id);

    const task = await Task.where("_id", taskId).first();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const user = await User.where("_id", new ObjectId(currentUser.id)).first();
    if (!user || !user.google_access_token) {
      return NextResponse.json(
        { error: "Please logout and login again with Google to enable Calendar sync." },
        { status: 400 }
      );
    }

    if (!task.due_date) {
      return NextResponse.json(
        { error: "Task must have a due date to sync with calendar" },
        { status: 400 }
      );
    }

    // Get or create task_user relation
    let taskUser = await TaskUser.query()
      .where('taskId', taskId)
      .where('userId', new ObjectId(currentUser.id))
      .first();

    if (!taskUser) {
      // Create task_user relation if not exists
      taskUser = await TaskUser.create({
        taskId: taskId,
        userId: new ObjectId(currentUser.id),
      });
    }

    let eventId: string | undefined = taskUser.google_calendar_event_id || undefined;

    if (eventId) {
      // Update existing event
      await updateCalendarEvent(
        user.google_access_token,
        eventId,
        task.title,
        task.description || "",
        new Date(task.due_date)
      );
    } else {
      // Create new event
      eventId = await createCalendarEvent(
        user.google_access_token,
        task.title,
        task.description || "",
        new Date(task.due_date)
      );

      // Save event ID to task_user relation (not task)
      await TaskUser.query()
        .where('taskId', taskId)
        .where('userId', new ObjectId(currentUser.id))
        .update({
          google_calendar_event_id: eventId,
        });
    }

    return NextResponse.json({
      message: "Task synced to Google Calendar",
      eventId,
    });
  } catch (error: any) {
    console.error("Calendar sync error:", error);
    
    // Check if it's a Google API permission error
    if (error.code === 403 || error.message?.includes('calendar-json.googleapis.com')) {
      return NextResponse.json(
        { 
          error: "Google Calendar API is not enabled. Please contact administrator to enable it in Google Cloud Console.",
          details: "Calendar API needs to be activated for this project."
        },
        { status: 403 }
      );
    }
    
    // Check if token expired
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return NextResponse.json(
        { 
          error: "Google Calendar access expired. Please logout and login again with Google.",
          needsReauth: true
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to sync with Google Calendar", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const currentUser = getCurrentUser(req);
    const taskId = new ObjectId(params.id);

    const task = await Task.where("_id", taskId).first();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get task_user relation for current user
    const taskUser = await TaskUser.query()
      .where('taskId', taskId)
      .where('userId', new ObjectId(currentUser.id))
      .first();

    if (!taskUser || !taskUser.google_calendar_event_id) {
      return NextResponse.json(
        { error: "Task is not synced with your calendar" },
        { status: 400 }
      );
    }

    const user = await User.where("_id", new ObjectId(currentUser.id)).first();
    if (!user || !user.google_access_token) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    await deleteCalendarEvent(user.google_access_token, taskUser.google_calendar_event_id);

    // Remove event ID from task_user relation
    await TaskUser.query()
      .where('taskId', taskId)
      .where('userId', new ObjectId(currentUser.id))
      .update({
        google_calendar_event_id: undefined,
      });

    return NextResponse.json({
      message: "Calendar sync removed",
    });
  } catch (error: any) {
    console.error("Calendar unsync error:", error);
    return NextResponse.json(
      { error: "Failed to remove calendar sync", details: error.message },
      { status: 500 }
    );
  }
}
