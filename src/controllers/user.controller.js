import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { trusted } from "mongoose";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user =   await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        console.log(accessToken, refreshToken, "tokens")

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    const {fullname, email, username, password} = req.body
    console.log("email: ", email)

    // validation (email and name not empty)
    // if(fullname === "") {
    //     throw new ApiError(400, "Fullname is requird")
    // }
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    // check if user aleady exists: username and email both
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(400, "User with email or username already exists")
    }

    // console.log(req.files, "Consoling for good luck")

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) {  
        throw new ApiError(400, "Avatar File is required");
    }

    // console.log(avatarLocalPath, "Consolinng for good luck 2")

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // console.log("console here last", avatar);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation 
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // return response - res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

    
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const {email, username, password} = req.body;

    // username or email
    if(!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // find the user
    const user = await User.findOne({ 
        $or: [
            {username}, {email}
        ]
     })

     if(!user) {
        throw new ApiError(404, "user does not exist")
     }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "password incorrect dv")
     }

    // access and refresh token genrate and give on password success
    const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id);

    // send cookies and send successful response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully "))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;

   if(!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request")
   }

try {
       const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
       )
    
       const user = await User.findById(decodedToken?._id)
    
       if(!user) {
        throw new ApiError(401, "Invalid refresh token")
       }
    
       if(incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
       }
    
       const options = {
        httpOnly: true,
        secure: true
       }
    
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken },
            "Access token refreshed"
        )
       )
} catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
}
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };