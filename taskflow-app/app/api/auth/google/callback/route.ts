import { NextRequest, NextResponse } from "next/server";
import User from "@/server/User";
import { signToken } from "@/helpers/jwt";
import { ObjectId } from "mongodb";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code || !CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      return NextResponse.redirect(`${url.origin}/login?error=auth_failed`);
    }

    // Get access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(`${url.origin}/login?error=token_failed`);
    }

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profile.email) {
      return NextResponse.redirect(`${url.origin}/login?error=profile_failed`);
    }

    // Find or create user
    let user = await User.where("email", profile.email).first();
    
    if (!user) {
      user = await User.create({
        email: profile.email,
        full_name: profile.name,
        password: "google-oauth",
        google_id: profile.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      });
    } else {
      // Update using mongoloquent update method
      await User.query()
        .where("_id", user._id)
        .update({
          password: "google-oauth",
          google_id: profile.id,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
        });
      
      
      // Refetch to confirm
      user = await User.where("_id", user._id).first();
    }

    if (!user) {
      return NextResponse.redirect(`${url.origin}/login?error=user_not_found`);
    }

    // Create session
    const token = signToken({ id: user._id, email: user.email, name: user.full_name });
    const response = NextResponse.redirect(`${url.origin}/`);
    response.cookies.set("access_token", token, { path: "/", httpOnly: false });
    
    return response;
  } catch (error) {
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/login?error=server_error`);
  }
}
