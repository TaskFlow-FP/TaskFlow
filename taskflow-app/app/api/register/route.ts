import User from "@/server/User";
import { userRegisterSchema } from "@/server/schemas/userSchema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const validatedData = userRegisterSchema.parse(body);
        
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        
        const user = await User.create({
            ...validatedData,
            password: hashedPassword,
        });
        
        return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
    } catch (error: any) {
        if (error.errors) {
            return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}