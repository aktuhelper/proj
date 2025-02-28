import express from 'express';
import { isAuthenticated, login, logout, register, resetpassword, sendResetOtp, sendVerifyOtp, verifyEmail } from '../controllers/auth.js';
import userAuth from '../middleware/userauth.js';

import userRouter from './userroute.js';
const authRouter= express.Router();
authRouter.post('/register',register)
authRouter.post('/login',login)
authRouter.post('/logout',logout)
authRouter.post('/send-verify-otp',userAuth,sendVerifyOtp)
authRouter.post('/verify-account',userAuth,verifyEmail)
authRouter.get('/isauth',userAuth,isAuthenticated)
authRouter.post('/sendResetOtp',sendResetOtp)
authRouter.post('/resetpassword',resetpassword)

export default authRouter