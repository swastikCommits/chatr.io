import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import userRouter from "./http/routes/user";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", userRouter);
// app.use("/ws/server", wsServer);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});