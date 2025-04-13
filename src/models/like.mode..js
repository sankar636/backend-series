import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref:"Comment"
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    }
},{timestamps: true})

const Like = mongoose.model("Like", likeSchema)