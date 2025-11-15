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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const status = searchParams.get('status');

    let query = Task.query();
    if (status && status !== 'all') {
      query = query.where('status', status);
    }
    
    const allTasks = await query.get();
    const totalTasks = allTasks.length;
    
    const tasks = await query
      .orderBy('created_at', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();

    console.log('=== TASKS API DEBUG ===');
    console.log('Total tasks in DB:', totalTasks);
    console.log('Current page:', page);
    console.log('Limit per page:', limit);
    console.log('Tasks returned:', tasks.length);
    console.log('Sample task:', tasks[0]);
    console.log('=======================');

    return NextResponse.json({ 
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTasks / limit),
        totalTasks,
        limit,
        hasNext: page < Math.ceil(totalTasks / limit),
        hasPrev: page > 1
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}
