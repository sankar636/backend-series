import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/FileUpload.js'
import { ApiResponse } from "../utils/ApiResponse.js";

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
        $or: [{username}, {email}]
    }) // Returns a user if either email or username matches

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    // (4) Get image paths from multer upload (if available)
    const avtarLocalPath = req.files?.avatar[0]?.path   // Path to temporarily stored avatar image
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    // Avatar is required
    if(!avtarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }

    // (5) Upload images to Cloudinary using utility function
    const avatar = await uploadOnCloudinary(avtarLocalPath); // Upload avatar image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); // (Optional) upload cover image

    // Check if avatar was successfully uploaded
    if(!avatar){
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
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // (9) Return success response with user data
    return res.status(201).json(
        new ApiResponse(200, createdUser,"User Registered Successfully")
    )

})

// Login controller (placeholder for future implementation)
// const login = asyncHandler(async (req,res,next) => {
// })

export {
    registerUser
}
