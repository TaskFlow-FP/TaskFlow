import { NextRequest, NextResponse } from "next/server";
import TaskUser from "@/server/TaskUser";
import { getCurrentUser } from "@/helpers/auth";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const currentUser = getCurrentUser(req);
    const taskId = new ObjectId(params.id);

    // Check if current user has synced this task to their calendar
    const taskUser = await TaskUser.query()
      .where('taskId', taskId)
      .where('userId', new ObjectId(currentUser.id))
      .first();

    return NextResponse.json({
      isSynced: !!taskUser?.google_calendar_event_id,
      eventId: taskUser?.google_calendar_event_id || null,
    });
  } catch (error: any) {
    console.error("Calendar status check error:", error);
    return NextResponse.json(
      { error: "Failed to check calendar status", details: error.message },
      { status: 500 }
    );
  }
}
