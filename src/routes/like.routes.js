import { Router } from "express";
import { 
    toggleVideoLike, 
    toggleCommentLike, 
    getLikedVideos,
    getLikesCount
} from "../controllers/like.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/like-video/:videoId").post(verifyJWT, toggleVideoLike)
router.route("/like-comment/:commentId").post(verifyJWT, toggleCommentLike)
router.route("/get-liked-videos").get(verifyJWT, getLikedVideos)
router.route("/video-likes/:id").get(getLikesCount)

export default router;