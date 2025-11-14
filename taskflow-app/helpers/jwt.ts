import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables')
}

export const signToken = (payload: string | object | Buffer) => {
    return jwt.sign(payload, JWT_SECRET)
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}