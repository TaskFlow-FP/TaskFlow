import { signToken } from "@/helpers/jwt";
import { userLoginSchema } from "@/server/schemas/userSchema";
import User from "@/server/User";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

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

        const token = signToken({ id: user._id.toString(), name: user.full_name })
        const cookieStore = await cookies()

        cookieStore.set("access_token", token, {
            httpOnly: false, 
            secure: false,
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            sameSite: 'lax'
        })

        console.log('Token set:', token);
        console.log('Cookie set successfully');

        return NextResponse.json({ message: 'Login successfully' })
    } catch (error: any) {
        if (error instanceof ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}