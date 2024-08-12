import { Router } from "express";
import { 
    createPlaylist, 
    addVideos, 
    removeVideos, 
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    getUserPlaylists
} from "../controllers/playlist.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-playlist").post(verifyJWT, createPlaylist)
router.route("/add-videos/:playlistId").post(verifyJWT, addVideos)
router.route("/remove-videos/:playlistId").delete(verifyJWT, removeVideos)
router.route("/get-playlist/:playlistId").get(getPlaylistById)
router.route("/update-playlist/:playlistId").patch(verifyJWT, updatePlaylist)
router.route("/delete-playlist/:playlistId").delete(verifyJWT, deletePlaylist)
router.route("/get-user-playlist/:userId").get(getUserPlaylists)

export default router;