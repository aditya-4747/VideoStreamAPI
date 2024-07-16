import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required!")
    }

    // upload avatar & coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log(avatar);

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

export { registerUser }