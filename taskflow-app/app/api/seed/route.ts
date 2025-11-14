import { NextResponse } from "next/server";
import Task from "@/server/Task";
import { ObjectId } from "mongodb";
import * as fs from "fs";
import * as path from "path";

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "taskflow-app", "db.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const tasks = JSON.parse(fileContent);

    const tasksWithObjectId = tasks.map((task: any) => ({
      ...task,
      projectId: new ObjectId(task.projectId),
      due_date: task.due_date ? new Date(task.due_date) : null,
    }));

    await Task.insertMany(tasksWithObjectId);

    return NextResponse.json(
      { message: `${tasks.length} tasks seeded successfully` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed tasks", details: error.message },
      { status: 500 }
    );
  }
}
