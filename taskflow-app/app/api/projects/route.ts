import Project from "@/server/Project";
import { projectCreateSchema } from "@/server/schemas/projectSchema";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const validatedData = projectCreateSchema.parse(body);
        
        const projectData = {
            ...validatedData,
            ownerId: new ObjectId(validatedData.ownerId),
        };
        
        const project = await Project.create(projectData);
        return NextResponse.json(project, { status: 201 });
    } catch (error: any) {
        if (error.errors) {
            return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const projects = await Project.with("owner", { exclude: ["password", "_id"] }).get();

    return NextResponse.json(projects);
}