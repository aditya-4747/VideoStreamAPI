import { Router } from "express";
import {
    addComment,
    getAllComments,
    removeComment,
    updateComment
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add-comment/:videoId").post(verifyJWT, addComment)
router.route("/remove-comment/:commentId").delete(verifyJWT, removeComment)
router.route("/update-comment/:commentId").patch(verifyJWT, updateComment)
router.route("/get-comments/:videoId").get(getAllComments)

export default router;