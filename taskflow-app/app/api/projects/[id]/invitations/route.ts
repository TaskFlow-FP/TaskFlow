import { getCurrentUser } from "@/helpers/auth";
import { signToken } from "@/helpers/jwt";
import Member from "@/server/Member";
import User from "@/server/User";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/mailer";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = getCurrentUser(request)
        const { id: projectId } = await params
        const body = await request.json()
        const { email: inviteeEmail } = body

        console.log('[Invitation] Inviting user:', inviteeEmail, 'to project:', projectId);

        if (!inviteeEmail || typeof inviteeEmail !== 'string') {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const inviterMembership = await Member.where("projectId", new ObjectId(projectId)).where('userId', new ObjectId(currentUser.id)).first()
        
        if (!inviterMembership || !['owner', 'editor'].includes(inviterMembership.role)) {
            console.log('[Invitation] Permission denied for user:', currentUser.id);
            return NextResponse.json({ error: "Forbidden: You don't have permission to invite members." }, { status: 403 });
        }

        const invitee = await User.where('email', inviteeEmail).first()
        if (!invitee) {
            console.log('[Invitation] User not found:', inviteeEmail);
            return NextResponse.json({ error: "User with this email not found. Please check the email address." }, { status: 404 });
        }

        console.log('[Invitation] Found user:', invitee._id);

        const existingMembership = await Member.where('projectId', new ObjectId(projectId)).where('userId', new ObjectId(invitee._id)).first();
        if (existingMembership) {
            console.log('[Invitation] User already member:', invitee._id);
            return NextResponse.json({ error: "This user is already a member of the project." }, { status: 409 });
        }

        const newMember = await Member.create({
            userId: invitee._id,
            projectId: new ObjectId(projectId),
            role: 'editor',
            invitation_status: 'pending'
        })

        console.log('[Invitation] Member created:', newMember._id);

        const invitationToken = signToken({ memberId: newMember._id.toString() })

        const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitation/accept?token=${invitationToken}`

        // Check if user has Google account (logged in via Google OAuth)
        const hasGoogleAccount = !!invitee.google_id;
        console.log('[Invitation] User has Google account:', hasGoogleAccount);

        let emailSent = false;

        // Try to send email only if Gmail credentials are configured
        const hasEmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
        
        if (hasEmailConfig && invitee.email && !invitee.email.includes('@example.com')) {
            console.log('[Invitation] Attempting to send email to:', invitee.email);

            try {
                const emailResult = await sendEmail({
                    to: invitee.email,
                    subject: `You have been invited to collaborate on a project!`,
                    html: `
                        <h1>You're Invited!</h1>
                        <p>${currentUser.name} has invited you to collaborate on a project.</p>
                        <p>Click the link below to accept the invitation:</p>
                        <a href="${acceptUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
                        <p>Or copy this link: ${acceptUrl}</p>
                        <p>This link will expire in 3 days.</p>
                    `
                });

                console.log('[Invitation] Email result:', emailResult);

                if (emailResult.success) {
                    emailSent = true;
                    console.log('[Invitation] Email sent successfully to:', invitee.email);
                } else {
                    console.error('[Invitation] Email failed:', emailResult.error);
                    emailSent = false;
                }
            } catch (emailError: any) {
                console.error('[Invitation] Email exception:', emailError);
                emailSent = false;
            }
        } else {
            console.log('[Invitation] Email not configured or invalid recipient - using in-app only');
        }

        // Return appropriate message based on method used
        let message = '';
        let notificationMethod = '';
        
        if (emailSent) {
            message = 'Invitation sent successfully! An email has been sent and the user can also accept from their Invitations page.';
            notificationMethod = 'email';
        } else {
            message = 'Invitation created successfully! The user can accept it from their Invitations page.';
            notificationMethod = 'in-app';
        }
        
        return NextResponse.json({ 
            message, 
            notificationMethod,
            hasGoogleAccount,
            emailSent
        })
    } catch (error: any) {
        console.error("INVITATION_SEND_ERROR:", error);
        console.error("Error details:", error.message, error.stack);
        return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
    }
}