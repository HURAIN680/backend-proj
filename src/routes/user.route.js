import router from 'express';
import registerUser  from '../controllers/user.controller.js';

const userRouter = router();

userRouter.route('/register').post(registerUser);


export default userRouter;


