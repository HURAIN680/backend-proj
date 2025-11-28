import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/users.model.js';
import {uploadImage} from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const { username, fullName, email, password } = req.body
    //console.log("email:", email);

    if ([username, fullName, email, password].some(field => !field || field.trim() === '')) {
        throw new ApiError(400, 'All fields are required');
    }
   
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(409, 'User with given email or username already exists');
    }

    const avatarlocation = req.files?.avatar[0]?.path;
    //const coverImagelocation = req.files?.coverImage[0]?.path; (error comes for undefined )

    let coverImagelocation;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagelocation = req.files.coverImage[0].path;
    }
    if (!avatarlocation) {
        throw new ApiError(400, 'Avatar image is required');
    }

    const avatarUploadResult = await uploadImage(avatarlocation);
    const coverImageUploadResult = await uploadImage(coverImagelocation);
    if (!avatarUploadResult) {
        throw new ApiError(500, 'Error uploading avatar image');
    }

    const user= await User.create({
        username: username.toLowerCase(),
        fullName,
        email: email.toLowerCase(),
        password,
        avatar: avatarUploadResult.url,
        coverImage: coverImageUploadResult?.url || ''
    });
   
    const CreatedUser = await User.findById(user._id).select('-password -refreshToken');
    if (!CreatedUser) {
        throw new ApiError(500, 'Error creating user');
    }

    res.status(201).json(new ApiResponse(201, 'User registered successfully', CreatedUser));

});

const RefreshtokenandAccessToken = async (userId) => {
   
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken; //save refresh token in db
        await user.save({ validateBeforeSave: false }); // save without password validation
        return { accessToken, refreshToken };


    } catch (error) {
       // console.error("Error generating tokens:", error);
        throw new ApiError(500, 'Error generating tokens');
        
    }
};

const loginUser = asyncHandler(async (req, res) => {
    //get data from frontend 
    //username or email
    //find the user
    //check password
    //generate refresh token and access token
    //send cookie

    const { username, email, password} = req.body;

    if (!username && !email) {
        throw new ApiError(400, 'Username or email is required to login');
    }

    const user= await User.findOne({ $or: [{email}, {username}]});
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isPasswordvalid = await user.isPasswordMatch(password);
    if (!isPasswordvalid) {
        throw new ApiError(401, 'Invalid user credentials!!');

    }

    const { accessToken, refreshToken } = await RefreshtokenandAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const options = {
        httpOnly: true,
        secure: true
    };

    res.status(200)
       .cookie('refreshToken', refreshToken, options)
       .cookie('accessToken', accessToken, options)
       .json(new ApiResponse(200, 'User logged in successfully', { loggedInUser, accessToken, refreshToken }));

}
);

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true});
    const options = {
        httpOnly: true,
        secure: true
    };
    return res.status(200)
        .clearCookie('refreshToken', options)
        .clearCookie('accessToken', options)
        .json(new ApiResponse(200, 'User logged out successfully'));

});


export { registerUser, loginUser, logoutUser };
