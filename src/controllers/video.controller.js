import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const publishVideo = asyncHandler(async (req,res) => {
    if(!Array.isArray(req.files?.video))    throw new ApiError(400, "Video file is required")
    if(!Array.isArray(req.files?.thumbnail))    throw new ApiError(400, "Thumbnail is required")

    const videoLocalPath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    const { title, description } = req.body;
    
    if(!title) throw new ApiError(404, "Video title is required")
    if(!description) throw new ApiError(404, "Description is required")

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!uploadedVideo)  throw new ApiError(400, "Video upload got failed")
    if(!thumbnail)  throw new ApiError(400, "Thumbnail upload got failed")

    const video = await Video.create({
        videoFile: uploadedVideo.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: parseInt(uploadedVideo.duration),
        owner: req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video uploaded successfully")
    )
})

const updateVideoDetails = asyncHandler(async (req,res) => {
    const { title, description } = req.body;
    const videoId = req.params?.videoId;

    if(!videoId)    throw new ApiError(400, "Video ID is required")

    if( !isValidObjectId(new mongoose.Types.ObjectId(videoId)) ){
        throw new ApiError(400, "Invalid Video ID")
    }

    if(!(title && description)) throw new ApiError(400, "Title and description is required")

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { title, description }
        },
        { new: true }
    )

    if(!video)  throw new ApiError(404, "Video does not exist")

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video details updated")
    )
})

const updateThumbnail = asyncHandler(async (req,res) => {
    const newThumbnailLocalPath = req.file?.path;
    const videoId = req.params?.videoId;

    if(!videoId)    throw new ApiError(400, "Video ID is required")

    if( !isValidObjectId(new mongoose.Types.ObjectId(videoId)) ){
        throw new ApiError(400, "Invalid Video ID")
    }

    if(!newThumbnailLocalPath)  throw new ApiError(404, "New thumbnail not found")

    const thumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

    const video = await Video.findByIdAndUpdate(
        new mongoose.Types.ObjectId(videoId),
        {
            $set: {
                thumbnail: thumbnail.url
            }
        },
        { new: false }
    )

    const thumbnailName = video.thumbnail.split("/")[7];
    const thumbnailPublicId = thumbnailName.split(".")[0];
    await deleteFromCloudinary(thumbnailPublicId);

    if(!video)  throw new ApiError(404, "Video does not exist")

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "New thumbnail applied successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const videoId = req.params?.videoId;

    if(!videoId){
        throw new ApiError(400, "Video ID is required")
    }

    if( !isValidObjectId(new mongoose.Types.ObjectId(videoId)) ){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(new mongoose.Types.ObjectId(videoId))

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished;
    video.save()

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Toggle successful"))
})

const getVideoById = asyncHandler(async(req,res) => {
    const videoId = req.params?.videoId;

    if(!videoId){
        throw new ApiError(400, "Video ID is required")
    }

    if( !isValidObjectId(new mongoose.Types.ObjectId(videoId)) ){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
    
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const deleteVideo = asyncHandler(async (req,res) => {
    const videoId = req.params?.videoId;

    if(!videoId){
        throw new ApiError(404, "Video ID is required")
    }
    
    if( !isValidObjectId(new mongoose.Types.ObjectId(videoId)) ){
        throw new ApiError(400, "Invalid Video ID")
    }

    const video = await Video.findOneAndDelete(
        { owner: new mongoose.Types.ObjectId(req.user._id) }
    );

    if(!video)  throw new ApiError(404, "Video not found")

    const videoName = video.videoFile.split("/")[7];
    const videoPublicId = videoName.split(".")[0];
    await deleteFromCloudinary(videoPublicId);
    
    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video deleted successfully"))
})

const getVideos = asyncHandler(async (req,res) => {
    const { page=1, limit=10, query, sortBy, sortType, userId } = req.query;

    // sortBy is the field name used for sorting
    // sortType is ascending(1)/descending(-1)
    // query is the string for searching
    // UserId is used to search videos from a specific creator

    try {
        const videos = await Video.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { title: {$regex: `${query}`} },
                                { owner: new mongoose.Types.ObjectId(userId) }
                            ]
                        },
                        { isPublished: true }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            { $sort: { [sortBy]: parseInt(sortType) } },
            { $skip: parseInt((page-1)*limit) },
            { $limit: parseInt(limit) }
        ])
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Videos fetched successfully")
        )
    } catch (error) {
        return res
        .status(400)
        .json({
            error: error?.message
        })
    }
})

export {
    publishVideo,
    updateVideoDetails,
    updateThumbnail,
    togglePublishStatus,
    getVideoById,
    deleteVideo,
    getVideos
}