import { Router } from "express";
import { 
    toggleVideoLike, 
    getLikedVideos,
    getLikesCount
} from "../controllers/like.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/like-video/:videoId").post(verifyJWT, toggleVideoLike)
router.route("/get-liked-videos").get(verifyJWT, getLikedVideos)
router.route("/get-likes/:id").get(getLikesCount)

export default router;