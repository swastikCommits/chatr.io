import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import { loginSchema, signupSchema } from "../../types";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken } from "./middleware";

const prisma = new PrismaClient();

const userRouter = express.Router();

userRouter.use(cookieParser());
userRouter.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
userRouter.use(express.json());


// userRouter.get('/api/auth/me', authenticateToken, async (req: any, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: (req.user as any).userId },
//       select: {
//         id: true,
//         email: true,
//         createdAt: true,
//       }
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ user });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });


userRouter.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { email: validEmail, password: validPassword } = signupSchema.parse({ email, password });

    const existingUser = await prisma.user.findUnique({
      where: { email: validEmail }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(validPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: validEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        // createdAt: true,
      }
    });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email }, process.env.JWT_SECRET
    );
    
    res.cookie("token", token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(201).json({ 
      message: "User created successfully",
      user 
    });

  } 
  catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}` 
      });
    }

    if (error instanceof Error) {
      if (error.message.includes("Email already registered")) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    res.status(500).json({ message: "Internal server error" });
  }
});


userRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { email: validEmail, password: validPassword } = loginSchema.parse({ email, password });

    const user = await prisma.user.findUnique({
      where: { email: validEmail }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(validPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email }, process.env.JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});


userRouter.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.status(200).json({ message: "Logged out successfully" });
});

export default userRouter;
 