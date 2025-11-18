import { getCurrentUser } from "@/helpers/auth";
import { verifyToken } from "@/helpers/jwt";
import Member from "@/server/Member";
import User from "@/server/User";
import Project from "@/server/Project";
import TaskNotifier from "@/server/TaskNotifier";
import { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request)
        const body = await request.json();
        const { token: invitationToken, memberId } = body;

        // Accept by token (from email link)
        if (invitationToken) {
            const decoded = verifyToken(invitationToken) as JwtPayload
            const { memberId: tokenMemberId } = decoded

            const member = await Member.where('_id', new ObjectId(tokenMemberId)).first();
            if (!member || member.invitation_status !== 'pending') {
                return NextResponse.json({ error: "Invitation not found, already accepted, or has been cancelled." }, { status: 404 });
            }

            if (member.userId.toString() !== currentUser.id) {
                return NextResponse.json({ error: "Forbidden: This invitation is for another user account." }, { status: 403 });
            }

            await Member.where('_id', tokenMemberId).update({
                invitation_status: 'accepted',
                joined_at: new Date()
            });

            // Get updated member with user info for SSE
            const updatedMember = await Member.where('_id', new ObjectId(tokenMemberId)).first();
            const user = await User.where('_id', updatedMember.userId).first();
            const memberWithUser = {
                ...updatedMember,
                user: user ? {
                    _id: user._id,
                    full_name: user.full_name,
                    email: user.email
                } : null
            };

            // Notify via SSE
            const notifier = TaskNotifier.getInstance();
            notifier.notifyMemberJoined(member.projectId.toString(), memberWithUser);

            return NextResponse.json({ message: "Invitation accepted successfully. Welcome to the project!" })
        }

        // Accept by memberId (from in-app notification)
        if (memberId) {
            if (!ObjectId.isValid(memberId)) {
                return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
            }

            const member = await Member.where('_id', new ObjectId(memberId)).first();
            if (!member || member.invitation_status !== 'pending') {
                return NextResponse.json({ error: "Invitation not found or already processed." }, { status: 404 });
            }

            if (member.userId.toString() !== currentUser.id) {
                return NextResponse.json({ error: "Forbidden: This invitation is for another user account." }, { status: 403 });
            }

            await Member.where('_id', new ObjectId(memberId)).update({
                invitation_status: 'accepted',
                joined_at: new Date()
            });

            // Get updated member with user info for SSE
            const updatedMember = await Member.where('_id', new ObjectId(memberId)).first();
            const user = await User.where('_id', updatedMember.userId).first();
            const memberWithUser = {
                ...updatedMember,
                user: user ? {
                    _id: user._id,
                    full_name: user.full_name,
                    email: user.email
                } : null
            };

            // Notify via SSE
            const notifier = TaskNotifier.getInstance();
            notifier.notifyMemberJoined(member.projectId.toString(), memberWithUser);

            return NextResponse.json({ message: "Invitation accepted successfully. Welcome to the project!" })
        }

        return NextResponse.json({ error: "Either token or memberId is required" }, { status: 400 });
    } catch (error: any) {
        if (error instanceof JsonWebTokenError) {
            return NextResponse.json({ error: "Invalid or expired invitation link. Please request a new one." }, { status: 400 });
        }
        
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');

        if (!memberId || !ObjectId.isValid(memberId)) {
            return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
        }

        const member = await Member.where('_id', new ObjectId(memberId)).first();
        if (!member || member.invitation_status !== 'pending') {
            return NextResponse.json({ error: "Invitation not found or already processed." }, { status: 404 });
        }

        if (member.userId.toString() !== currentUser.id) {
            return NextResponse.json({ error: "Forbidden: This invitation is for another user account." }, { status: 403 });
        }

        await Member.where('_id', new ObjectId(memberId)).update({
            invitation_status: 'declined'
        });

        return NextResponse.json({ message: "Invitation declined." });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
