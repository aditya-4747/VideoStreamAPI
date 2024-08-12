import { Router } from "express";
import { 
    deleteVideo, 
    getVideoById, 
    getVideos, 
    publishVideo, 
    togglePublishStatus, 
    updateThumbnail, 
    updateVideoDetails 
} from "../controllers/video.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// router.route("/get-videos").get(getVideoList)
router.route("/publish-video").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
)
router.route("/update-details/:videoId").patch(verifyJWT, updateVideoDetails)
router.route("/update-thumbnail/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateThumbnail
)
router.route("/toggle-publish-status/:videoId").patch(verifyJWT, togglePublishStatus)
router.route("/get-video/:videoId").get(getVideoById)
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo)
router.route("/video-query").get(getVideos)

export default router;