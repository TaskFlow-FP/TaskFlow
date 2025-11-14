import User from "@/server/User";
import { userRegisterSchema } from "@/server/schemas/userSchema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const validatedData = userRegisterSchema.parse(body);

        const existingUser = await User.where("email", validatedData.email).first()
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already exists' },
                { status: 400 }
            )
        }
        
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        
        const user = await User.create({
            ...validatedData,
            password: hashedPassword,
        });
        
        return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
    } catch (error: any) {
        if (error instanceof ZodError) {
            return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
        }
        console.error('Register error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}