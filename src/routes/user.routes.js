import { Router } from "express";
import { 
    changePassword, 
    getChannelDetails, 
    getCurrentUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAvatar, 
    updateCoverImage, 
    updateUserDetails 
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/get-channel/:username").get(getChannelDetails);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-details").patch(verifyJWT, updateUserDetails);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/change-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

export default router;