import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({limit: "16kb"}))
app.use(express.static("./public"));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(cookieParser());

// route import 
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

// route declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);

export { app };