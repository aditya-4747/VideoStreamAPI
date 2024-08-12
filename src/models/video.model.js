import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema({
    videoFile: {
        type: String,   //cloudinary URL
        required: true,
        unique: true
    },
    thumbnail: {
        type: String,   //cloudinary URL
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });

videoSchema.pre("save", next => next())

export const Video = mongoose.model("Video", videoSchema);