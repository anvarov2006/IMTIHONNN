import express from "express";
import { register,verifyEmail,resendCode,login,forgotPassword,resetPassword } from "../controller/auth.controller.js";
const router = express.Router();
router.post("/register",register);
router.post("/verify-email",verifyEmail);
router.post("/resend-code",resendCode);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export {
    router
}