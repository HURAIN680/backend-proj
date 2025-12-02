import router from 'express';
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateUserProfile, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';
import verifyJWT from '../middlewares/auth.middleware.js';

const userRouter = router();

userRouter.route('/register').post(upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), registerUser);
userRouter.route('/login').post(loginUser);
// secured routes
userRouter.route('/logout').post(verifyJWT, logoutUser);
userRouter.route('/refresh-token').post(refreshAccessToken);
userRouter.route('/change-password').post(verifyJWT, changePassword);
userRouter.route('/get-current-user').get(verifyJWT, getCurrentUser);
userRouter.route('/update-account-details').patch(verifyJWT, updateUserProfile);
// updating avatar 2 middlewares...1) to verify JWT 2) single file upload
userRouter.route('/update-avatar').patch(verifyJWT, upload.single('avatar'), updateAvatar);
userRouter.route('/update-cover-image').patch(verifyJWT, upload.single('coverImage'), updateCoverImage);

// to get channel profile using params (: is used to denote params)
userRouter.route('/c/:username').get(verifyJWT, getUserChannelProfile);
userRouter.route('/watch-history').get(verifyJWT, getWatchHistory);


export default userRouter;


