import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res, next) => {
   try {
     // As req have access of all cookie (app.use(cookieParser())) access here
     const token =req.cookies?.accessToken || req.header("Authorization").replace("Bearer ","")
 
     if(!token){// check for token
         throw new ApiError(400,"Unauthorized request")
     }
 
     // after checking of token check for accessToken data(generateAccessToken--> userModel). i.e decoded token(as it was encoded)
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
     // find the user form DB
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user){
         // forntend
         throw new ApiError(401, "Invalid Access token")
     }
     // if user exist 
     req.user = user
     next()
   } catch (error) {
    throw new ApiError(500,error?.message || "invalid access token")
   }
}) // we make middleware which is used at router 


// IMPORTANT --> this middleware not only to check user loged in or not but also used in many cases like (to add post and to like to a post)
