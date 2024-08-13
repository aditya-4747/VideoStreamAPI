import { Router } from "express";
import { 
    getSubscribers, 
    getSubscriptions, 
    toggleSubscriptionStatus 
} from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle-subscription/:channelId").patch(verifyJWT, toggleSubscriptionStatus)
router.route("/get-subscribers/:channelId").get(verifyJWT, getSubscribers)
router.route("/get-user-subscriptions/:userId").get(verifyJWT, getSubscriptions)

export default router;