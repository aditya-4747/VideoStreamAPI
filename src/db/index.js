import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    } catch (error) {
        console.error(`MongoDB connection FAILED : ${error}`);
        process.exit(1);
    }
}

export default connectDB;