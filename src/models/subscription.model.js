import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: { // one who subscribing a channel
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: { // one whom subscriber subscribing 
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true }

)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)