import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout", details: error.message },
      { status: 500 }
    );
  }
}
