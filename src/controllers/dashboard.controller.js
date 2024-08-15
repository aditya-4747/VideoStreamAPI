import mongoose, { isValidObjectId } from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const getChannelVideos = asyncHandler(async (req,res) => {
    const channelId = req.params.channelId;
    const { page=1, limit=10 } = req.query;
    
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400, "Valid channel ID is required")
    }

    const videos = await Video.aggregate([
        { 
            $match: {
                $and: [
                    { owner: new mongoose.Types.ObjectId(channelId) },
                    { isPublished: true }
                ]
            } 
        },
        {
            $sort: { createdAt: -1 } 
        },
        { 
            $project: {
                title: 1,
                description: 1,
                views: 1,
                thumbnail: 1,
                createdAt: 1
            }
        },
        { 
            $skip: parseInt((page-1)*limit) 
        },
        { 
            $limit: parseInt(limit) 
        }
    ])

    if(!videos.length){
        throw new ApiError(404, "No videos found")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, videos, "Videos fetched successfully"))
})

const getChannelStats = asyncHandler(async (req,res) => {
    try {
        let channelId = req.params.channelId;
        
        if(!channelId || !isValidObjectId(channelId)){
            throw new ApiError(400, "Valid channel ID is required")
        }
    
        channelId = new mongoose.Types.ObjectId(channelId)
        
        // response: {
        //     avatar,
        //     coverImage,
        //     username,
        //     fullName,
        //     subscribers,
        //     isSubscribed,
        //     videosCount,
        //     totalViews
        // }
    
        const stats = await User.aggregate([
            {
                $match: { _id: channelId }
            },
            {
                $lookup: {
                    from: "videos",
                    as: "videos",
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { owner: channelId },
                                    { isPublished: true }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    videosCount: { $size: "$videos" },
                    totalViews: { $sum: "$videos.views" }
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $addFields: {
                    subscriberCount: {
                        $size: "$subscribers"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    avatar: 1,
                    coverImage: 1,
                    username: 1,
                    fullName: 1,
                    videosCount: 1,
                    totalViews: 1,
                    subscriberCount: 1,
                    isSubscribed: 1
                }
            }
        ])
    
        if(!stats){
            throw new ApiError(404, "Channel does not exist")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, stats[0], "Channel stats fetched successfully"))

    } catch (error) {
        return res
        .status(400)
        .json({
            error: error.message
        })
    }
})

export {
    getChannelVideos,
    getChannelStats
}