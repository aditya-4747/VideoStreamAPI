import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
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

    // check if user already exists using username & email
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(existingUser){
        throw new ApiError(400, "User with username or email already exists.")
    }

    // check for avatar & coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required!")
    }

    // upload avatar & coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log(avatar);

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

    if(!username || !email) {
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
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, 
            accessToken, 
            refreshToken
        }),
        "User logged in successfully."
    )
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
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

export { 
    registerUser,
    loginUser,
    logoutUser
}