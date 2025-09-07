import dotenv from "dotenv";
dotenv.config();

import express from "express";
import userRouter from "./http/routes/user";
import "./ws/server"; 

const app = express();

app.use(express.json());

app.use("/api/auth", userRouter);

app.listen(3000, () => {
    console.log("HTTP Server is running on port 3000");
});

// http://localhost: 8080 -> Frontend
// http://localhost: 3000 -> Backend
// http://localhost: 8081 -> WebSocket