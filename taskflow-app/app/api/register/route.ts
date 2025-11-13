import User from "@/server/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json()

    const user = await User.create(body)

    return NextResponse.json({ message: 'Register berhasil' }, { status: 201 })
}