import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
