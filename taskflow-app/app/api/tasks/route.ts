import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ZodError } from "zod";
import { taskCreateSchema } from "@/server/schemas/taskSchema";
import Task from "@/server/Task";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedData = taskCreateSchema.parse(body);

    const task = await Task.create({
      projectId: new ObjectId(validatedData.projectId),
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status || "backlog",
      priority: validatedData.priority || "medium",
      due_date: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    });

    return NextResponse.json(
      {
        message: "Task created successfully",
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let tasks;
    if (projectId) {
      tasks = await Task.where("projectId", new ObjectId(projectId)).get();
    } else {
      tasks = await Task.all();
    }

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
