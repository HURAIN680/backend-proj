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
    console.log("email:", email);

    if ([username, fullName, email, password].some(field => !field || field.trim() === '')) {
        throw new ApiError(400, 'All fields are required');
    }
   
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(409, 'User with given email or username already exists');
    }

    const avatarlocation = req.files?.avatar[0]?.path;
    const coverImagelocation = req.files?.coverImage[0]?.path;
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




export default registerUser;
