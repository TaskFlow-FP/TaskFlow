import { getCurrentUser } from "@/helpers/auth";
import { verifyToken } from "@/helpers/jwt";
import Member from "@/server/Member";
import { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request)
        const { token: invitationToken } = await request.json()

        if (!invitationToken) {
            return NextResponse.json({ error: "Invitation token invalid." }, { status: 400 });
        }

        const decoded = verifyToken(invitationToken) as JwtPayload
        const { memberId } = decoded

        const member = await Member.where('_id', new ObjectId(memberId)).first();
        if (!member || member.invitation_status !== 'pending') {
            return NextResponse.json({ error: "Invitation not found, already accepted, or has been cancelled." }, { status: 404 });
        }

        if (member.userId.toString() !== currentUser.id) {
            return NextResponse.json({ error: "Forbidden: This invitation is for another user account." }, { status: 403 });
        }

        await Member.where('_id', memberId).update({
            invitation_status: 'accepted',
            joined_at: new Date()
        });

        return NextResponse.json({ message: "Invitation accepted successfully. Welcome to the project!"})
    } catch (error: any) {
        if (error instanceof JsonWebTokenError) {
            return NextResponse.json({ error: "Invalid or expired invitation link. Please request a new one." }, { status: 400 });
        }
        
        console.error("ACCEPT_INVITATION_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}