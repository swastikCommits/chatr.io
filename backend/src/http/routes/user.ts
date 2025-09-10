import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { generateRoom } from "../../lib/generate";
import jwt from "jsonwebtoken";
import cors from "cors";
import { loginSchema, signupSchema, AuthenticatedRequest } from "../../types";
import prisma from "../../lib/prisma";
import { z } from "zod";
import { authenticateToken } from "../middleware/middleware";

const userRouter = express.Router();
userRouter.use(express.json());
userRouter.use(cookieParser());
userRouter.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));

userRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: req.user!.userId 
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        username: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get('/check-username', async (req: Request, res: Response) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: "Username is required" });
    }

    if (username.length < 6) {
      return res.json({ available: false, message: "Username must be at least 6 characters" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get('/rooms', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const userRooms = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        rooms: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!userRooms) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ rooms: userRooms.rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fast endpoint for recent messages only (for instant loading)
userRouter.get('/rooms/:roomId/messages/recent', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;

    // Ultra-fast query: Get only last 10 messages without room membership check initially
    const messages = await prisma.message.findMany({
      where: {
        roomId: roomId,
        room: {
          users: {
            some: {
              id: userId
            }
          }
        }
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get('/rooms/:roomId/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20; // Reduced default from 50 to 20
    const offset = parseInt(req.query.offset as string) || 0;

    // Optimized: Single query to check room membership and get messages
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        users: {
          some: {
            id: userId
          }
        }
      },
      select: {
        id: true,
        messages: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc' // Get newest first, then reverse in frontend
          },
          take: limit,
          skip: offset
        }
      }
    });

    if (!room) {
      return res.status(403).json({ message: "Access denied. You are not a member of this room." });
    }

    // Reverse to get chronological order (oldest first)
    const messages = room.messages.reverse();

    res.json({ messages, hasMore: room.messages.length === limit });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get('/ws-token', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication token not found" });
    }
    res.json({ wsToken: token });
  } catch (error) {
    console.error('Generate WS token error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post('/rooms', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
  
    const generatedRoomId = generateRoom();
    const room = await prisma.room.create({
      data: {
        id: generatedRoomId,
        name: generatedRoomId,
        users: {
          connect: {
            id: userId 
          }
        }
      }
    });

    res.status(201).json({ 
      message: "Room created successfully",
      room: {
        id: room.id,
        name: room.name
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post('/signup', async (req, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) { 
      return res.status(400).json({ message: "Email, password and username are required" });
    }

    const { email: validEmail, password: validPassword, username: validUsername } = signupSchema.parse({ email, password, username });

    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: validEmail },
          { username: validUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === validEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingUser.username === validUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const hashedPassword = await bcrypt.hash(validPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: validEmail,
        password: hashedPassword,
        username: validUsername,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      }
    });

    if (!process.env.JWT_SECRET) {  
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET
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

    res.status(500).json({ message: "Internal server error" });
  }
});


userRouter.post('/login', async (req, res: Response) => {
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
      { userId: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET
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
        username: user.username,
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


userRouter.post('/logout', (req, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.status(200).json({ message: "Logged out successfully" });
});

export default userRouter;
 