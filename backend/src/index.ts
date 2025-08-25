import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import userRouter from "./http/routes/user";
import "./ws/server"; // Just import to start the WebSocket server/

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", userRouter);

app.listen(3000, () => {
    console.log("HTTP Server is running on port 3000");
    console.log("WebSocket Server is running on port 8080");
});