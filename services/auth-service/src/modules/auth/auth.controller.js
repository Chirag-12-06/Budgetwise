import {
  registerUser,
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
} from "./auth.service.js";

import asyncHandler from "../../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.validated.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const { user, token } = await loginUser(email.trim().toLowerCase(), password);

  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;

  const result = await forgotPasswordUser(email);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.validated.body;

  const result = await resetPasswordUser(token, password);

  res.status(200).json({
    success: true,
    ...result,
  });
});
