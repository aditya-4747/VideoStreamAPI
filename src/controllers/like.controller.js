import mongoose, { isValidObjectId } from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req,res) => {
    const videoId = req.params.videoId;

    if( !videoId || !isValidObjectId(videoId) ){
        throw new ApiError(400, "Valid video ID is required")
    }

    const videoData = await Video.findById(videoId);

    if(!videoData){
        throw new ApiError(404, "Video does not exists")
    }

    let videoLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id
    })

    let message;

    if( !videoLike ){

        videoLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        message = "Video liked"

    } else {
        message = "Video disliked"
    }

    return res
    .status(200)
    .json( new ApiResponse(200, videoLike, message) )
})

const toggleCommentLike = asyncHandler(async (req,res) => {
    const commentId = req.params.commentId;

    if( !commentId || !isValidObjectId(commentId) ){
        throw new ApiError(400, "Valid comment ID is required")
    }

    const commentData = await Comment.findById(commentId);

    if(!commentData){
        throw new ApiError(404, "Comment does not exists")
    }

    let commentLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user._id
    })

    let message;

    if( !commentLike ){

        commentLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        message = "Comment liked"

    } else {
        message = "Comment disliked"
    }

    return res
    .status(200)
    .json( new ApiResponse(200, commentLike, message) )
})

const getLikedVideos = asyncHandler(async (req,res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                $and: [ {video: {$exists: true}}, {likedBy: new mongoose.Types.ObjectId(req.user._id)} ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                video: 1,
            }
        }
    ])    
    
    return res
    .status(200)
    .json( new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
    
})

const getLikesCount = asyncHandler(async (req,res) => {
    const id = new mongoose.Types.ObjectId(req.params.id);    

    if(!id || !isValidObjectId(id)){
        throw new ApiError(400, "Valid ID is required")
    }

    const likeCount = await Like.aggregate([
        {
            $match: { $or: [ {video: id}, {comment: id} ] }
        },
        {
            $count: "likes"
        }
    ])

    return res
    .status(200)
    .json( new ApiResponse(200, likeCount[0], "Like count fetched successfully"))
    
})

export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos,
    getLikesCount
}