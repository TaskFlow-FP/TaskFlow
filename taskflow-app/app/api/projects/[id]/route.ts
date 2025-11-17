import { getCurrentUser } from "@/helpers/auth";
import Member from "@/server/Member";
import Project from "@/server/Project";
import { projectUpdateSchema } from "@/server/schemas/projectUpdateSchema";
import Task from "@/server/Task";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = getCurrentUser(request) 
        const { id: projectId } = await params

        const body = await request.json()
        const validatedData = projectUpdateSchema.parse(body)

        if (Object.keys(validatedData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const project = await Project.where('_id', new ObjectId(projectId)).first();
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.ownerId.toString() !== currentUser.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedProject = await Project.where('_id', new ObjectId(projectId)).update(validatedData);

        return NextResponse.json(updatedProject);
    } catch (error: any) {
        if (error.message.includes("Not authenticated")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error(`Project update error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = getCurrentUser(request)
        const { id: projectId } = await params

        const project = await Project.where('_id', new ObjectId(projectId)).first();
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.ownerId.toString() !== currentUser.id) {
            return NextResponse.json({ error: "Forbidden: Only the project owner can delete." }, { status: 403 });
        }

        await Promise.all([
            Task.where('projectId', new ObjectId(projectId)).delete(),   
            Member.where('projectId', new ObjectId(projectId)).delete(),  
            Project.where('_id', new ObjectId(projectId)).delete()       
        ]);

        return NextResponse.json({ message: "Project deleted successfully" })
    } catch (error: any) {
        if (error.message.includes("Not authenticated")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error(`Project delete error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = getCurrentUser(request);
        const { id: projectId } = await params;

        console.log('GET /api/projects/[id] - projectId:', projectId);
        console.log('GET /api/projects/[id] - currentUser.id:', currentUser.id);
        console.log('GET /api/projects/[id] - new ObjectId(projectId):', new ObjectId(projectId));
        console.log('GET /api/projects/[id] - new ObjectId(currentUser.id):', new ObjectId(currentUser.id));

        // Cek semua members di project ini
        const allMembers = await Member.where('projectId', new ObjectId(projectId)).get();
        console.log('GET /api/projects/[id] - allMembers count:', allMembers.length);
        console.log('GET /api/projects/[id] - allMembers:', JSON.stringify(allMembers, null, 2));

        const membership = await Member.where('projectId', new ObjectId(projectId))
                                       .where('userId', new ObjectId(currentUser.id))
                                       .where('invitation_status', 'accepted')
                                       .first();
        
        console.log('GET /api/projects/[id] - membership:', membership);
        
        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const [project, tasks, members] = await Promise.all([
            Project.where('_id', new ObjectId(projectId)).with("owner", { exclude: ['password'] }).first(),
            Task.where('projectId', new ObjectId(projectId)).get(),
            Member.where('projectId', new ObjectId(projectId)).with('user', { exclude: ['password'] }).get()
        ]);

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json({ project, tasks, members });

    } catch (error: any) {
        if (error.message.includes("Not authenticated")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error(`Project fetch detail error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}