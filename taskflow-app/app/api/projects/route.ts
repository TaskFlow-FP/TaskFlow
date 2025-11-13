import Project from "@/server/Project";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json()
    body.userId = new ObjectId(body.userId)

    const project = await Project.create(body)
    return NextResponse.json(project, { status: 201 })
}

export async function GET(request: NextRequest) {
    const projects = await Project.with("user", { exclude: ["password", "_id"]}).get()

    return NextResponse.json(projects)
}