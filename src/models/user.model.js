import { Schema } from "mongoose"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, // cloudnary url
        required: true,
    },
    coverImage: {
        type: String // cloudnairy url
    },
    whtchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "video"
        },
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
},
    { timestamps: true }
)

// use of pre hooks in mongoose
// this will encrypt the password before saving it
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 8)
    next()
})

// custom methods
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// To generate Access token
userSchema.methods.generateAccessToken = function () { // debug methods instead of method
   return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// To generate refresh token (In refresh the information was less)
userSchema.methods.generateRefreshToken = function () { // debug methods instead of method
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model('User', userSchema)


// The below part encrypt password after every save . We used a if statement
// userSchema.pre("save", async function(next){
//     this.password = bcrypt.hash(this.password, 8)
//     next()
// })