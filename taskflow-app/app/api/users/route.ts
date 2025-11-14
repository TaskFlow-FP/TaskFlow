import User from "@/server/User";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const users = await User.exclude(["password", "email"]).with('projects').get();
        return NextResponse.json({ users });
    } catch (error) {
        console.error('Users fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}