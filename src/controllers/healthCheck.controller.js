import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthCheck = asyncHandler(async (_,res) => {
    // const mongoStatus = mongoose.connection.readyState === 1;
    
    // const status = {
    //     uptime: process.uptime(),
    //     timestamp: Date.now(),
    //     mongo: mongoStatus ? "connected" : "disconnected",
    // };
    
    // if (!mongoStatus) {
    //     return res.status(500).json(new ApiResponse(500, status, "Database not connected"));
    // }
    
    return res.status(200).json( new ApiResponse(200, {}, "Server is healthy!") )
});

export { healthCheck }

