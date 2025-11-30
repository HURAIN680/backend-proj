import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
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


//ENDPOINT HITTING FOR GENEREATING ACCESS TOKEN USING REFRESH TOKEN AFTER IT EXPIRED (route: prep)
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token is missing');
    }

    try {
        const decodedtoken= jwt.verify(incomingRefreshToken, process.env.refresh_token_secret)
        const user = await User.findById(decodedtoken._id);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
    
        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, 'Invalid refresh token');
        }
        const options = {
            httpOnly: true,
            secure: true
        };
    
        const { accessToken, newRefreshToken } = await RefreshtokenandAccessToken(user._id);
    
        res.status(200)
           .cookie('refreshToken', newRefreshToken, options)
           .cookie('accessToken', accessToken, options)
           .json(new ApiResponse(200, 'Access token refreshed successfully', { accessToken, refreshtoken: newRefreshToken }));
    
    } catch (error) {
       // console.error("Error refreshing access token:", error);
        throw new ApiError(500, 'Error refreshing access token');
    }
});


const changePassword = asyncHandler(async (req, res) => {
    // get old password and new password from req body
    // validate both are present
    // find user from req.user._id
    // check old password is correct
    // set new password
    // save user
    // return res

    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'Old password and new password are required');
    }

   const user = await User.findById(req.user._id);

   if (!user) {
       throw new ApiError(404, 'User not found');
   }

   const isOldPasswordValid = await user.isPasswordMatch(oldPassword);
   if (!isOldPasswordValid) {
       throw new ApiError(401, 'Invalid old password');
   }

   user.password = newPassword;
   await user.save();

   return res.status(200).json(new ApiResponse(200, 'Password changed successfully'));
 });

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, 'Current user fetched successfully', req.user));

});

const updateUserProfile = asyncHandler(async (req, res) => {
    // get user details from req body
    // find user from req.user._id
    // update user fields
    // save user
    // return res

    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, 'Full name and email are required');
    }

    const user = await User.findByIdAndUpdate(req.user?._id, { 
        $set: { fullName, email } }, { new: true }).select('-password -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res.status(200).json(new ApiResponse(200, 'User profile updated successfully', user));
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.file?.path;
    if (!avatarPath) {
        throw new ApiError(400, 'Avatar image is required');
    }

    // STEP 1: Get user and store old avatar URL before updating
    const existingUser = await User.findById(req.user._id).select('avatar');
    const oldAvatarUrl = existingUser?.avatar;

    // STEP 2: Upload new avatar
    const avatarUploadResult = await uploadImage(avatarPath);
    if (!avatarUploadResult.url) {
        throw new ApiError(500, 'Error uploading avatar image');
    }

    // STEP 3: Update user with new URL
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatarUploadResult.url } },
        { new: true }
    ).select('-password -refreshToken');

    // STEP 4: Delete previous image from Cloudinary
    if (oldAvatarUrl) {
        const publicId = extractPublicId(oldAvatarUrl);
        await deleteImage(publicId);
    }

    return res.status(200).json(
        new ApiResponse(200, 'Avatar updated successfully', { avatar: user.avatar })
    );
});


const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImagePath = req.file?.path;
    if (!coverImagePath) {
        throw new ApiError(400, 'Cover image is required');
    }

    // STEP 1: Get the existing user to store old cover image before update
    const existingUser = await User.findById(req.user._id).select('coverImage');
    const oldCoverImageUrl = existingUser?.coverImage;

    // STEP 2: Upload new image
    const coverImageUploadResult = await uploadImage(coverImagePath);
    if (!coverImageUploadResult.url) {
        throw new ApiError(500, 'Error uploading cover image');
    }

    // STEP 3: Update user record with new image URL
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImageUploadResult.url } },
        { new: true }
    ).select('-password -refreshToken');

    // STEP 4: Delete old Cloudinary image (if exists)
    if (oldCoverImageUrl) {
        const publicId = extractPublicId(oldCoverImageUrl);
        await deleteImage(publicId); // Assumes deleteImage(publicId) works with Cloudinary
    }

    return res.status(200).json(
        new ApiResponse(200, 'Cover image updated successfully', { coverImage: user.coverImage })
    );
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateUserProfile, updateAvatar, updateCoverImage };
