import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    // Validate Channel ID
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if channel exists (optional but recommended)
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel does not exist");
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        user: userId,
        channel: channelId,
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return ApiResponse.success(res, {
            message: "Unsubscribed from channel",
        });
    }

    await Subscription.create({
        user: userId,
        channel: channelId,
    });

    return ApiResponse.success(res, {
        message: "Subscribed to channel",
    });
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}