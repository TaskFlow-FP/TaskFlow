import { NextRequest, NextResponse } from "next/server";
import Task from "@/server/Task";
import Project from "@/server/Project";
import Member from "@/server/Member";
import { taskCreateSchema } from "@/server/schemas/taskSchema";
import { ObjectId } from "mongodb";
import TaskNotifier from "@/server/TaskNotifier";
import { getCurrentUser } from "@/helpers/auth";

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    const body = await req.json();
    const validated = taskCreateSchema.parse(body);

    // Check if user is member of the project
    const projectId = new ObjectId(validated.projectId);
    const membership = await Member.query()
      .where('userId', new ObjectId(currentUser.id))
      .where('projectId', projectId)
      .where('invitation_status', 'accepted')
      .first();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    const taskData: any = {
      projectId: projectId,
      title: validated.title,
      description: validated.description,
      status: validated.status || "todo",
      priority: validated.priority || "medium",
      due_date: validated.dueDate ? new Date(validated.dueDate) : null,
      google_calendar_event_id: null,
    };

    const task = await Task.create(taskData);

    const notifier = TaskNotifier.getInstance();
    notifier.notifyTaskCreated(task);

    return NextResponse.json(
      { message: "Task created successfully", task },
      { status: 201 }
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
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const status = searchParams.get('status');

    // Get all projects where user is a member
    const memberships = await Member.query()
      .where('userId', new ObjectId(currentUser.id))
      .where('invitation_status', 'accepted')
      .get();

    const projectIds = memberships.map(m => m.projectId);

    // If user is not member of any project, return empty
    if (projectIds.length === 0) {
      return NextResponse.json({ 
        tasks: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalTasks: 0,
          limit,
          hasNext: false,
          hasPrev: false
        }
      }, { status: 200 });
    }

    // Filter tasks by projects user is member of
    let countQuery = Task.query().whereIn('projectId', projectIds);
    let dataQuery = Task.query().whereIn('projectId', projectIds);
    
    if (status && status !== 'all') {
      countQuery = countQuery.where('status', status);
      dataQuery = dataQuery.where('status', status);
    }
    
    const allTasks = await countQuery.get();
    const totalTasks = allTasks.length;
    
    const tasks = await dataQuery
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();

    const projects = await Project.query()
      .whereIn('_id', [...new Set(tasks.map(t => t.projectId))])
      .get();
    
    const projectMap = new Map(projects.map(p => [p._id.toString(), p]));

    const enrichedTasks = tasks.map(task => ({
      ...task,
      project: projectMap.get(task.projectId.toString()) || null
    }));

    return NextResponse.json({ 
      tasks: enrichedTasks,
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
    if (error.message === "Not authenticated" || error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}
