import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/auth";
import User from "@/server/User";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    
    const user = await User.where("_id", new ObjectId(currentUser.id)).first();
    
    return NextResponse.json({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      hasGoogleCalendar: !!user?.google_access_token,
      isGoogleUser: user?.password === "google-oauth",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
