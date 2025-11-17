import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { ObjectId } from "mongodb";

export function getCurrentUser(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
        throw new Error("Not authenticated");
    }
    try {
        const decoded = verifyToken(token);
        return decoded as { id: string; email: string; name: string }
    } catch (error) {
        throw new Error("Invalid token")
    }
}

export async function getUserIdFromToken(request: NextRequest): Promise<ObjectId | null> {
    try {
        const user = getCurrentUser(request);
        return new ObjectId(user.id);
    } catch (error) {
        return null;
    }
}