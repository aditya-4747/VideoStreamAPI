import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscriptionStatus = asyncHandler(async (req,res) => {
    const channelId = req.params.channelId;

    if( !isValidObjectId(channelId) ){
        throw new ApiError(400, "Channel ID is invalid")
    }

    if( channelId === req.user._id.toString() ){
        throw new ApiError(403, "Invalid operation")
    }

    let subscriber = await Subscription.findOne({
        $and: [
            { subscriber: req.user._id },
            { channel: new mongoose.Types.ObjectId(channelId) }
        ]
    })

    if(!subscriber){
        subscriber = await Subscription.create({
            subscriber: req.user._id,
            channel: new mongoose.Types.ObjectId(channelId)
        })

        return res
        .status(200)
        .json( new ApiResponse(200, subscriber, "Subscribed successfully") )
        
    } else {
        subscriber = await Subscription.findByIdAndDelete(subscriber._id)

        return res
        .status(200)
        .json( new ApiResponse(200, subscriber, "Unsubscribed successfully") )
    }
})

const getSubscribers = asyncHandler(async (req,res) => {
    try {
        const channelId = req.params.channelId;
    
        if( !isValidObjectId(channelId) ){
            throw new ApiError(400, "Channel ID is invalid")
        }
    
        const subscribersList = await Subscription.find({ channel: channelId })

        const subscribers = subscribersList.map( item => item.subscriber )
    
        return res
        .status(200)
        .json(new ApiResponse(200, { subscribers }, "Subscribers list fetched"))
        
    } catch (error) {
        return res
        .status(400)
        .json({
            error: error?.message
        })
    }
})

const getSubscriptions = asyncHandler(async (req,res) => {
    try {
        const userId = req.user._id;
    
        if( !isValidObjectId(userId) ){
            throw new ApiError(400, "User ID is invalid")
        }
    
        const subscriptionList = await Subscription.find({ subscriber: userId })

        const subscriptions = subscriptionList.map( item => item.channel )
    
        return res
        .status(200)
        .json(new ApiResponse(200, { subscriptions }, "Subscriptions list fetched"))
        
    } catch (error) {
        return res
        .status(400)
        .json({
            error: error?.message
        })
    }
})

export {
    toggleSubscriptionStatus,
    getSubscribers,
    getSubscriptions
}