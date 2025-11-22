import router from express;

const userRouter = router();

router.route('/register').post(registerUser);


export default userRouter;


