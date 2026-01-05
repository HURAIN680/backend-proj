import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    // Validate channel ID
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Prevent subscribing to own channel
    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    // Check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Check existing subscription
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    // Unsubscribe
    if (existingSubscription) {
        await existingSubscription.deleteOne();

        return res.status(200).json(
            new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully")
        );
    }

    // Subscribe
    await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
    });

    return res.status(201).json(
        new ApiResponse(201, { isSubscribed: true }, "Subscribed successfully")
    );
});

// controller to return subscriber list of a channel
export const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channel ID
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Fetch subscribers
    const subscriptions = await Subscription.find({ channel: channelId }).populate('subscriber', 'username fullName avatarUrl');

    const subscribers = subscriptions.map(sub => sub.subscriber);

    return res.status(200).json(
        new ApiResponse(200, { subscribers }, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}