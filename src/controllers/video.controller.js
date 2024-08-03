import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoList = asyncHandler(async (req, res) => {
    // Use $regexWatch
})

export {
    getVideoList,
}