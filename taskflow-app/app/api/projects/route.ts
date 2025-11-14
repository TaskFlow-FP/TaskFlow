import { getCurrentUser } from "@/helpers/auth";
import Member from "@/server/Member";
import Project from "@/server/Project";
import { projectCreateSchema } from "@/server/schemas/projectSchema";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request)
        const body = await request.json()

        const validatedData = projectCreateSchema.parse(body)

        const newProject = await Project.create({
            ...validatedData,
            ownerId: new ObjectId(currentUser.id)
        })

        await Member.create({
            userId: new ObjectId(currentUser.id),
            projectId: newProject._id,
            role: 'owner',
            invitation_status: 'accepted',
            joined_at: new Date()
        })

        return NextResponse.json(newProject, { status: 201 });
    } catch (error: any) {
        if (error.message === "Not authenticated" || error.message === "Invalid token") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error('Project creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request)
        console.log("ID DARI TOKEN:", currentUser.id);
        console.log("ID SETELAH DIUBAH JADI OBJECTID:", new ObjectId(currentUser.id));
        const memberships = await Member.where('userId', new ObjectId(currentUser.id)).where('invitation_status', 'accepted').get()
        console.log("JUMLAH MEMBERSHIP DITEMUKAN:", memberships.length);
        const projectIds = memberships.map(member => member.projectId)

        if (projectIds.length === 0) {
            return NextResponse.json({ projects: [] })
        }

        const projects = await Project.whereIn('_id', projectIds).with("owner", { exclude: ['password'] }).get()

        return NextResponse.json({ projects })
    } catch (error: any) {
        if (error.message === "Not authenticated" || error.message === "Invalid token") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error('Project fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}