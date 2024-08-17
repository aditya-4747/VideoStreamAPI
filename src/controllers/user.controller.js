import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import fs from "fs";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens!")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    
    // get user details from frontend
    const { fullName, username, email, password } = req.body;

    // validation { not empty }
    if ( [fullName, username, email, password].some( 
        field => field?.trim() === ""
    )){
        throw new ApiError(400, "Credentials are required!")
    }

    // check for avatar & coverImage
    if(!Array.isArray(req.files.avatar))    throw new ApiError(400, "Avatar file is required")
        
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required!")
    }

    // check if user already exists using username & email
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(existingUser){
        fs.unlinkSync(avatarLocalPath);
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(400, "User with username or email already exists.")
    }

    // upload avatar & coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(500, "Something went wrong while uploading avatar!")
    }

    // create entry in db
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })

    // Check if db is successfully populated with user & remove password and refresh token fields from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong with registration. Please try again!")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    )

})

const loginUser = asyncHandler( async (req,res) => {

    // get username and password from req.body
    const { username, email, password } = req.body;

    if(req.cookies.accessToken){
        throw new ApiError(403, "An user is already logged in.")
    }

    if(!(username || email)) {
        throw new ApiError(400, "Username or email is required.")
    }

    // search for user with the username
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist.")
    }

    // compare the password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect.")
    }

    // generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // get user data with refreshToken
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set options for cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    // send response with cookies
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser
        },
        "User logged in successfully."
    ))
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    }, {
        new: true
    })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out."))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken;

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request.")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user || incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token.")
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token regenerated successfully.")
        )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token");
    }
})

const changePassword = asyncHandler(async (req,res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Current password is wrong")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const updateUserDetails = asyncHandler(async (req,res) => {
    const { fullName, email } = req.body;

    if(!(fullName && email)){
        throw new ApiError(400, "Both fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName, email }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User details updated")
    )
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user ? req.user : null, "User fetched successfully")
    )
})

const updateAvatar = asyncHandler(async (req,res) => {
    try {
        const avatarLocalPath = req.file?.path;

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is missing")
        }
    
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if(!avatar.url) {
            throw new ApiError(400, "Error occured while uploading avatar image")
        }
    
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { avatar: avatar.url }
            },
            { new: false } // Returns the old values
        ).select("-password");

        // Delete previously stored image from Cloudinary
        const avatarName = user.avatar.split("/")[7];
        const avatarPublicId = avatarName.split(".")[0];
        await deleteFromCloudinary(avatarPublicId);

        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while updating avatar")
    }
})

const updateCoverImage = asyncHandler(async (req,res) => {
    try {
        const coverImageLocalPath = req.file?.path;

        if(!coverImageLocalPath){
            throw new ApiError(400, "Cover image is missing")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!coverImage.url) {
            throw new ApiError(400, "Error occured while uploading cover image")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { coverImage: coverImage.url }
            },
            { new: false }
        ).select("-password");

        // Delete previously stored image from Cloudinary
        const coverImageName = user.coverImage.split("/")[7];
        const coverImagePublicId = coverImageName.split(".")[0];
        await deleteFromCloudinary(coverImagePublicId);

        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while updating cover image")
    }
})

const getChannelDetails = asyncHandler(async (req,res) => {
    const { username } = req.params;

    if(!username?.trim()) {
        throw new ApiError(404, "Username not found")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User details fetched successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateUserDetails,
    getCurrentUser,
    updateAvatar,
    updateCoverImage,
    getChannelDetails,
}