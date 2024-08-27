import { Router } from "express";
import { 
    getSubscribers, 
    getSubscriptions, 
    toggleSubscriptionStatus 
} from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT) // It makes all routes to use verifyJWT

router.route("/toggle-subscription/:channelId").patch(toggleSubscriptionStatus)
router.route("/get-subscribers/:channelId").get(getSubscribers)
router.route("/get-user-subscriptions/").get(getSubscriptions)

export default router;