import { isValidObjectId } from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req,res) => {
    try {
        const { name, description } = req.body;        
    
        if(!(name && description)){
            throw new ApiError(400, "Both name and description are required");
        }
    
        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id
        })

        return res
        .status(200)
        .json( new ApiResponse(200, playlist, "Playlist created successfully."))

    } catch (error) {
        return res
        .status(400)
        .json({
            error: error.message
        })
    }
})

const addVideos = asyncHandler(async (req,res) => {
    // Accept an array of ObjectId's to add
    // like, ["ad4c6a4d6ca4c6a4c6a", "3sca4c54ad684a68cea354"]

    let videos = req.body;

    if(!Array.isArray(videos) || !videos.length){
        throw new ApiError(400, "Array of video IDs is expected!!")
    }   

    const playlistId = req.params.playlistId;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist ID is invalid")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!")
    }

    // TODO : Validate every Video ID
    // const existingVideos = await Video.aggregate([ {$group: { _id: "$_id" }} ])

    videos.forEach(element => {
        if(!isValidObjectId(element)){
            throw new ApiError(400, "Video Id is invalid")
        }
        if(playlist.video.includes(element)){
            throw new ApiError(400, "Video already exists in the playlist")
        }
        playlist.video.push(element)
    })
    playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Videos added successfully")
    )
})

const removeVideos = asyncHandler(async (req,res) => {
    let videos = req.body;

    if(!Array.isArray(videos) || !videos.length){
        throw new ApiError(400, "Array of video IDs is expected!!")
    }   

    const playlistId = req.params.playlistId;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist ID is invalid")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!")
    }

    videos.forEach(element => {

        if(playlist.video.includes(element)){
            let index = playlist.video.indexOf(element);
            playlist.video.splice(index, 1)
        } else {
            throw new ApiError(400, "Video(s) does not exist in playlist")
        }
    })
    playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Videos removed successfully")
    )
})

const getPlaylistById = asyncHandler(async (req,res) => {
    const playlistId = req.params.playlistId;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist ID is invalid")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const updatePlaylist = asyncHandler(async (req,res) => {
    const { name, description } = req.body;
    
    if(!(name || description)){
        throw new ApiError(400, "Title or description is missing")
    }

    const playlistId = req.params.playlistId;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist ID is invalid")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true }
    )

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, playlist, "Playlist details updated"))
})

const deletePlaylist = asyncHandler(async (req,res) => {
    const playlistId = req.params.playlistId;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist ID is invalid")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist!")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, playlist, "Playlist deleted successfully"))
})

const getUserPlaylists = asyncHandler(async (req,res) => {
    const userId = req.params.userId;

    if(!userId){
        throw new ApiError(400, "User ID is required")
    }

    const userPlaylists = await Playlist.find({ owner: userId })

    if(!userPlaylists){
        throw new ApiError(404, "No playlist available")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, userPlaylists, "User playlists fetched"))
})

export {
    createPlaylist,
    addVideos,
    removeVideos,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    getUserPlaylists
}