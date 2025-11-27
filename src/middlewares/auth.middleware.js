import ApiError from "../utils/ApiError";
import asynchandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";

export const verifyJWT= asynchandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
    
        if (!accessToken) {
           throw new ApiError(401, 'Unauthorized: No access token provided');
    
        }
    
        const decoded = jwt.verify(accessToken, process.env.access_token_secret);
        const user = await User.findById(decoded?._id).select('-password -refreshToken');
    
    
        if (!user) {
            throw new ApiError(401, 'Unauthorized: User not found');
        }
    
        req.user = user;
        next();
        
    } catch (error) {
        throw new ApiError(401, 'Unauthorized: Invalid access token');
        
    }
});

