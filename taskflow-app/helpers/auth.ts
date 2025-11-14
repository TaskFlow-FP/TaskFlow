import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export function getCurrentUser(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        throw new Error("Not authenticated");
    }
    try {
        const decoded = verifyToken(token);
        return decoded as { id: string; email: string; fullName: string }
    } catch (error) {
        throw new Error("Invalid token")
    }
}