import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    //   console.log(decoded);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(403).json({ message: "Invalid token." });
    }
};