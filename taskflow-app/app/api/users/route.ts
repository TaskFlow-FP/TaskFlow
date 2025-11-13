import User from "@/server/User";
import { NextResponse } from "next/server";

export async function GET() {
    const users = await User.exclude(["password", "email"]).with('projects').get()

    return NextResponse.json(users)
}