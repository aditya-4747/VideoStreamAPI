import { Comment } from "../models/comment.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req,res) => {
    const content = req.body.content;
    const videoId = req.params.videoId;

    if(!content){
        throw new ApiError(400, "Content is required to comment")
    }

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Valid video ID is required")
    }

    const existingComment = await Comment.find({
        video: videoId,
        owner: req.user._id
    })

    if(existingComment.length){
        throw new ApiError(400, "A comment already exists")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if(!comment){
        throw new ApiError(400, "Error occured while creating comment")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, comment, "Comment created successfully"))
})

const removeComment = asyncHandler(async (req,res) => {
    const commentId = req.params.commentId;

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, "Valid comment ID is required")
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if(!comment){
        throw new ApiError(404, "Comment does not exist")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, comment, "Comment removed successfully") )
})

const updateComment = asyncHandler(async (req,res) => {
    const content = req.body.content;

    if(!content){
        throw new ApiError(400, "Comment content is required")
    }
    const commentId = req.params.commentId;

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, "Valid comment ID is required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    )

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, comment, "Comment updated successfully") )
})

const getAllComments = asyncHandler(async (req,res) => {
    const videoId = req.params.videoId;
    const { page=1, limit=10 } = req.query;

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Valid video ID is required")
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        { $skip: parseInt((page-1)*limit) },
        { $limit: limit}
    ])

    if(!comments.length){
        throw new ApiError(404, "No comments found")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, comments, "Comments fetched successfully"))
})

export {
    addComment,
    removeComment,
    updateComment,
    getAllComments
}