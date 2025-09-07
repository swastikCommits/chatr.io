import { z } from "zod"
import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { WebSocket } from "ws";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required") 
});

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(3),
});

export interface UserJWTPayload extends JwtPayload {
    userId: string;
    email: string;
    username: string;
}

export interface AuthenticatedRequest extends Request {
    user?: UserJWTPayload;
}

export interface AuthenticatedWebSocket extends WebSocket {
    user?: UserJWTPayload;
}