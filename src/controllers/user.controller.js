import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

    console.log(req.files, "Consoling for good luck")

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {  
        throw new ApiError(400, "Avatar File is required");
    }

    console.log(avatarLocalPath, "Consolinng for good luck 2")

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log("console here last", avatar);

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
        username: username.toLowercase()
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

export { registerUser };