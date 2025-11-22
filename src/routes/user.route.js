import router from 'express';

const userRouter = router();

userRouter.route('/register').post(registerUser);


export default userRouter;


