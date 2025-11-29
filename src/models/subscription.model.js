import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId, //user who subscribes
        ref: 'User',
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId, //channel being subscribed to by user (channel is also a user)
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', SubscriptionSchema);






