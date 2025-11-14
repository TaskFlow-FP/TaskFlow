import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import Task from "@/server/Task";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "db.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const tasks = JSON.parse(fileContent);

    const tasksToInsert = tasks.map((task: any) => ({
      ...task,
      _id: new ObjectId(task._id),
      projectId: new ObjectId(task.projectId),
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));

    await Task.insertMany(tasksToInsert);

    return NextResponse.json(
      { message: `${tasksToInsert.length} tasks seeded successfully` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
