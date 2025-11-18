import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/auth";
import User from "@/server/User";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    
    const user = await User.where("_id", new ObjectId(currentUser.id)).first();
    
    return NextResponse.json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        google_id: user?.google_id,
        hasGoogleCalendar: !!user?.google_access_token,
        isGoogleUser: !!user?.google_id,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
