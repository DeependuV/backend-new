import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { decode } from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {

   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     // req.header("Authorization")?.replace("Bearer ", "") -> this has something to do with how are we getting the token in jwt
     // in jwt the token of authorization is sent by the name of authorization(see that in docs)
     // and that token has a value by "Bearer <token>"
 
     if(!token) {
         throw new ApiError(401, "Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user) {
         throw new ApiError(401, "Invalid access token")
     }
 
     req.user = user;
     next()

   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
   }
})