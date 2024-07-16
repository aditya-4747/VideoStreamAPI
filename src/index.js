import connectDB from "./db/index.js";
import { app } from "./app.js";

// import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000, () => {
        console.log(`Server started successfully on port ${process.env.PORT || 4000}`);
    })
})
.catch((error) => {
    console.log("MongoDB connection failed!!", error);
})