import { signToken } from "@/helpers/jwt";
import { userLoginSchema } from "@/server/schemas/userSchema";
import User from "@/server/User";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = userLoginSchema.parse(body)
        const user = await User.where("email", validatedData.email).first()
        const isValidPassword = user && user.password ? await bcrypt.compare(validatedData.password, user.password) : false;

        if (!user || !isValidPassword) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const token = signToken({ _id: user._id, name: user.full_name })
        const cookieStore = await cookies()

        cookieStore.set("access_token", token, {
            httpOnly: false, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax'
        })

        return NextResponse.json({ message: 'Login successfully' })
    } catch (error: any) {
        if (error.errors) {
            return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}