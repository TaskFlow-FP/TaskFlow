import { getCurrentUser } from "@/helpers/auth";
import { signToken } from "@/helpers/jwt";
import Member from "@/server/Member";
import User from "@/server/User";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = getCurrentUser(request)
        const { id: projectId } = await params
        const { email: inviteeEmail } = await request.json()

        const inviterMembership = await Member.where("projectId", new ObjectId(projectId)).where('userId', new ObjectId(currentUser.id)).first()
        
        if (!inviterMembership || !['owner', 'editor'].includes(inviterMembership.role)) {
            return NextResponse.json({ error: "Forbidden: You don't have permission to invite members." }, { status: 403 });
        }

        const invitee = await User.where('email', inviteeEmail).first()
        if (!invitee) {
            return NextResponse.json({ error: "This user is already a member of the project." }, { status: 409 });
        }

        const existingMembership = await Member.where('projectId', new ObjectId(projectId)).where('userId', new ObjectId(invitee._id)).first();
        if (existingMembership) {
            return NextResponse.json({ error: "This user is already a member of the project." }, { status: 409 });
        }

        const newMember = await Member.create({
            userId: invitee._id,
            projectId: new ObjectId(projectId),
            role: 'editor',
            invitation_status: 'pending'
        })

        const invitationToken = signToken({ memberId: newMember._id.toString() })

        const acceptUrl = `http://localhost:3000/invitations/accept?token=${invitationToken}`

        await resend.emails.send({
            from: 'TaskFlow <onboarding@resend.dev>',
            to: invitee.email,
            subject: `You have been invited to collaborate on a project!`,
            html: `
                <h1>You're Invited!</h1>
                <p>${currentUser.fullName} has invited you to collaborate on a project.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${acceptUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
                <p>This link will expire in 3 days.</p>
            `
        })

        return NextResponse.json({ message: 'Invitation sent successfully.' })
    } catch (error) {
        console.error("INVITATION_SEND_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}