import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/FileUpload.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        console.log("User:", user);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken()
        console.log("Access Token:", accessToken);
        const refreshToken = user.generateRefreshToken()
        console.log("Refresh Token:", refreshToken);

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // fixed bug await is needed here
        // Inside save(), we use { validateBeforeSave: false } to avoid running unnecessary validations.

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token or refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // (1) Extract required fields from the request body
    const { email, username, password, fullname } = req.body
    console.log("email :", email);
    // (2) Validate required fields
    // Option 1: Beginner style validation
    // if(fullname === ""){
    //     throw new ApiError(400, "Full Name is required")
    // }else if(email === ""){
    //     throw new ApiError(400, "Email is required")
    // }else if(name === ""){
    //     throw new ApiError(400, "User Name is required")        
    // }else if(password === ""){
    //     throw new ApiError(400, "Password is required")        
    // }
    // Option 2: Cleaner validation using array and some()
    // if([email,name,password,fullname].some((field) => (field?.trim() === ""))){
    //     throw new ApiError(400,`${field} is required`)
    // }
    // Option 3: Better readability with key-specific error message
    const fields = { email, username, password, fullname };
    for (const [key, value] of Object.entries(fields)) {
        if (!value?.trim()) {
            throw new ApiError(400, `${key} is required`);
        }
    }
    // (3) Check if a user already exists with the same email or username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    }) // Returns a user if either email or username matches
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // (4) Get image paths from multer upload (if available)
    const avtarLocalPath = req.files?.avatar[0]?.path   // Path to temporarily stored avatar image
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    // Avatar is required
    if (!avtarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }
    // (5) Upload images to Cloudinary using utility function
    const avatar = await uploadOnCloudinary(avtarLocalPath); // Upload avatar image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); // (Optional) upload cover image
    // Check if avatar was successfully uploaded
    if (!avatar) {
        throw new ApiError(400, "Avatar image was not uploaded to Cloudinary")
    }
    // (6) Create a new user in the database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // (7) Retrieve the newly created user without password and refreshToken
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    // (8) Ensure the user was created successfully
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // (9) Return success response with user data
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

// Login controller
const loginUser = asyncHandler(async (req, res) => {
    // (12.)
    const { email, username, password } = req.body
    //(13.)
    //Option-1 this is for login by either username or password
    if (!username && !email) {
        throw new ApiError(400, "Enter Username or email")
    }
    //Option-2 this is for login by email
    // if(!email){
    //     throw new ApiError(400,"Enter email")
    // }
    //Option-3 this isfor login by username
    // if(!username){
    //     throw new ApiError(400,"Enter username")
    // }
    //(14)
    const user = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if (!user) {
        throw new ApiError(401, "User does not exist")
    }
    //(15)
    // check for password -- in user model we defined a method called isPasswordCorrect -- by using this we have to check for the password. Then we store it in a variable 
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user Credintial")
    }
    //(16)
    // generate refreshToken and accessToken
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // debug await missing

    //(17)
    //send cookie // to send cookies we have to use options(documentation)

    const options = {  // if we do this then the accessToken and refreshToken can not be changed by any one in fronted it can only be updated at serverside
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                "user logedIn successfully",
                {
                    user: loggedInUser, refreshToken, accessToken
                } // this is the data field which server can send to the user 
            )
        )// after all successful set router for login
})
//Logout controller
const logoutUser = asyncHandler(async (req, res) => {
    // after complete of auth.middleware and logout routing now here we have access of user(req.user._id)
    await User.findByIdAndUpdate(  // debut findByIdAndUpdate instead of findById
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
            //$unset:{refreshToken:1} // try it
        },
        {
            new: true // it will give new value after return of response
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options) // debug .clearCookie("accessToken", accessToken, options)
        .clearCookie("refreshToken", options) // debug .clearCookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "user logged out successfully", {}))
})

// creating controller for end point for refreshing the access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        //(1)
        const incommingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken
        // here i give incommingRefreshToken instead of refreshToken because we already have a refreshToken for the user in our database
        //(2)
        if (!incommingRefreshToken) {
            throw new ApiError(401, "Unauthorized Request")
        }
        //(3)
        //Verify this incomming token
        const decodedIncommingToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        //(4)
        // Find the information from DB by decodedIncommingToken (if it matches the refreshtoken stored in the DB then )
        const user = await User.findById(decodedIncommingToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid RefreshToken")
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "RefreshToken is expired or used")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
        // console.log(req.cookies); this is for debuging
        
        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "Access Token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }

})

// change the password for user by giving the oldpassword
const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body
    // Optional: Add confirmPassword check
    // const { oldPassword, newPassword, confirmPassword } = req.body;
    // if (newPassword !== confirmPassword) {
    //     throw new ApiError(400, "Password confirmation failed");
    // }

    if (!oldPassword || !newPassword) {
        throw new ApiError(401, "Password field should not be empth")
    }

    const user = await User.findById(req.user?._id) // debug --> // Use `req.user._id` instead of `req.body._id` for security

    const isPassword = await user.isPasswordCorrect(oldPassword)

    if (!isPassword) {
        throw new ApiError(400, "Incorrect Password Entered")
    }

    user.password = newPassword  //debug --> // use `password` field, not `oldPassword`

    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

// get the current user
const getCurrentUser = asyncHandler(async (req, res) => {
    // // By now, req.user is already filled by the middleware
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        )
})

// update Account Details
const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(401, "fullname or email required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details updataed successfully"
            )
        )
})

const updateAvatar = asyncHandler(async (req, res) => {

    // we will get avtar from req.file --> the file access by multer middleware 
    const avtarLocalPath = req.file?.path

    if (!avtarLocalPath) {
        throw new ApiError(400, "No avtar was found")
    }
    // Assignment: delete old image 
    const avatar = await uploadOnCloudinary(avtarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading the avatar file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "avatar updated successfully"
            )
        )

})
const updateCoverImage = asyncHandler(async (req, res) => {

    // we will get avtar from req.file --> the file access by multer middleware 
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "No coverImage was found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the coverImage file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "coverImage updated successfully"
            )
        )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    // To fetch the channel's profile, we need the user's URL (or unique identifier).
    // We'll extract this information from the route parameter (req.params).
    // This allows us to identify and retrieve the specific user's channel data.
    //(1)
    // console.log(req.params);   // for debugging 
    const { username } = req.params
    //(2)
    if (!username?.trim()) {
        throw new ApiError(400, "username is ")
    }
    // console.log("USERNAME PARAM:", username); // for debugging
    
    //(3)
    // option:1
    // const user = User.findById({username})  ....

    //option:2 (use of aggregation method)
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // to find subscriber of a channel let getSetUniversal Fact
        {
            $lookup: {
                from: "subscriptions", // from subscription model --> Subscription this will changed to subscriptions(all lowercase and "s" at the last--plural)
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // to find how many channels the live(getSetUniversal Fact) user subscribed
        {
            $lookup: {
                from: "subscriptions", // from subscription model --> Subscription this will changed to subscriptions(all lowercase and "s" at the last--plural)
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // Now add these two pipeline in the user model
        {
            $addFields: {
                // count of subscribers(usrs subscribed to you)
                subscribersCount: {
                    $size: "$subscribers"
                },
                // count of how many channel(user) you subscribed
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                // showing of this user is subscribed to you or not 
                isSubscribed: {
                    $cond: {
                        // check if the user is present in the subscriber list or not
                        // in check and give true or false
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])
    // console.log("CHANNEL:", channel); // for debugging

    if (!(channel?.length)) {
        throw new ApiError(400, "Channel is not exist")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fatched successfully"
            )
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    // To get the videos a user has watched, we can store the video IDs in the user's `watchHistory` array.
    // However, since we also need to display the uploader's (channel's) profile for each video,
    // we'll need to use an aggregation pipeline with a nested `$lookup` to fetch both video and user data.
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) //// still works, but shows deprecation warning in some setups.instead of this we can also use 
                // import { Types } from "mongoose";
                // new Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname,
                                        username,
                                        avatar
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fecthed successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

// Notes --> if in the term asyncHandler(async(req,res) => {} if res have no use then we can use "_" instead of res like asyncHandler(async(req,_) => {
