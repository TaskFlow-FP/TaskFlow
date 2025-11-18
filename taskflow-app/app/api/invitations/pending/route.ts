import { getCurrentUser } from "@/helpers/auth";
import Member from "@/server/Member";
import Project from "@/server/Project";
import User from "@/server/User";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        // Get current user details to check if they have Google account
        const user = await User.where('_id', new ObjectId(currentUser.id)).first();
        

        // Get all pending invitations for current user
        const pendingMembers = await Member.query()
            .where('userId', new ObjectId(currentUser.id))
            .where('invitation_status', 'pending')
            .get();


        // Populate project and inviter information
        const invitations = await Promise.all(
            pendingMembers.map(async (member) => {
                const project = await Project.where('_id', member.projectId).first();
                const inviter = await User.where('_id', project?.ownerId || new ObjectId()).first();

                return {
                    _id: member._id,
                    projectId: member.projectId,
                    projectName: project?.name || 'Unknown Project',
                    projectDescription: project?.description || '',
                    role: member.role,
                    invitedBy: inviter ? {
                        name: inviter.full_name,
                        email: inviter.email,
                    } : null,
                    invitedAt: member.createdAt,
                };
            })
        );

        return NextResponse.json({ invitations });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
    }
}
