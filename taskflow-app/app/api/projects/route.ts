import Project from "@/server/Project";
import { projectCreateSchema } from "@/server/schemas/projectSchema";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

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
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error('Project creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const projects = await Project.with("owner", { exclude: ["password", "_id"] }).get();
        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Project fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}