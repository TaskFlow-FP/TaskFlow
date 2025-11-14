import { NextRequest, NextResponse } from "next/server";
import Task from "@/server/Task";
import { taskCreateSchema } from "@/server/schemas/taskSchema";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = taskCreateSchema.parse(body);

    const taskData: any = {
      projectId: new ObjectId(validated.projectId),
      title: validated.title,
      description: validated.description,
      status: validated.status || "todo",
      priority: validated.priority || "medium",
      due_date: validated.dueDate ? new Date(validated.dueDate) : null,
      google_calendar_event_id: null,
    };

    const task = await Task.create(taskData);

    return NextResponse.json(
      { message: "Task created successfully", task },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create task error:", error);
    if (error.errors) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tasks = await Task.get();
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}
