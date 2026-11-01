import {
  registerUser,
  loginUser,
} from "./auth.service.js";

import asyncHandler from "../../../../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  const user = await registerUser({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const { user, token } = await loginUser(
    email.trim().toLowerCase(),
    password
  );

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